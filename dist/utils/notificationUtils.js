"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisibleNotificationsForUser = getVisibleNotificationsForUser;
exports.createScopedNotification = createScopedNotification;
exports.notifyLeaveApprovers = notifyLeaveApprovers;
const socket_1 = require("../utils/socket");
const Prisma_1 = __importDefault(require("./Prisma"));
async function getVisibleNotificationsForUser(userId) {
    // console.log("🔍 getVisibleNotificationsForUser called with:", userId); // ✅ Add this
    const user = await Prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
            subRole: true,
            employee: {
                select: {
                    id: true,
                    departmentId: true,
                    subDepartmentId: true,
                },
            },
        },
    });
    if (!user || !user.role || user.status === 'INACTIVE') {
        return [];
    }
    const allNotifications = await Prisma_1.default.notification.findMany({
        orderBy: { createdAt: 'desc' },
    });
    const visibleNotifications = allNotifications.filter((notification) => {
        // 1. If it's a personal notification
        if (notification.userId === user.id)
            return true;
        // 2. Exclude notifications about the user themselves (e.g., new employee joined)
        if (notification.employeeId && notification.employeeId === user.employee?.id) {
            return false;
        }
        // 3. Visibility Scopes
        switch (notification.visibilityLevel) {
            case 0: // Only Admins
                return user.role.name === 'admin';
            case 1: // Director, Manager, TeamLead
                return (user.role.name === 'user' &&
                    ['director', 'manager', 'teamLead'].includes(user.subRole?.name || ''));
            case 2: // Department-based
                return (user.employee?.departmentId &&
                    user.employee.departmentId === notification.departmentId);
            case 3: // Sub-department-based
                return (user.employee?.subDepartmentId &&
                    user.employee.subDepartmentId === notification.subDepartmentId);
            case 4: // All users
                return true;
            default:
                return false;
        }
    });
    console.log("🔔 NOTIFICATION LOGS:");
    console.log({
        userId: user.id,
        role: user.role.name,
        subRole: user.subRole?.name,
        employeeId: user.employee?.id,
        departmentId: user.employee?.departmentId,
        subDepartmentId: user.employee?.subDepartmentId,
    });
    return visibleNotifications;
}
// utils/notificationUtils.ts
async function createScopedNotification(opts) {
    const { scope, data, targetIds, visibilityLevel, excludeUserId } = opts;
    console.log('📥 Incoming Notification Options:', opts);
    const notification = await Prisma_1.default.notification.create({
        data: {
            ...data,
            userId: targetIds?.userId,
            employeeId: targetIds?.employeeId,
            departmentId: targetIds?.departmentId,
            subDepartmentId: targetIds?.subDepartmentId,
            visibilityLevel,
        }
    });
    console.log('✅ Notification Created:', notification.id);
    let targetUserIds = [];
    switch (scope) {
        case 'ADMIN_ONLY':
            targetUserIds = (await Prisma_1.default.user.findMany({
                where: { role: { name: 'admin' }, status: 'ACTIVE' },
                select: { id: true }
            })).map(u => u.id);
            break;
        case 'DIRECTORS_HR':
            targetUserIds = (await Prisma_1.default.user.findMany({
                where: {
                    role: { name: 'user' },
                    subRole: { name: { in: ['director', 'manager'] } },
                    roleTag: "HR",
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;
        case 'MANAGERS_DEPT':
            if (!targetIds?.departmentId)
                break;
            targetUserIds = (await Prisma_1.default.user.findMany({
                where: {
                    employee: {
                        departmentId: targetIds.departmentId
                    },
                    subRole: {
                        name: { in: ['manager'] }
                    },
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;
        case 'TEAMLEADS_SUBDEPT':
            if (!targetIds?.subDepartmentId)
                break;
            targetUserIds = (await Prisma_1.default.user.findMany({
                where: {
                    employee: {
                        subDepartmentId: targetIds.subDepartmentId
                    },
                    subRole: {
                        name: { in: ['teamLead'] }
                    },
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;
        case 'EMPLOYEE_ONLY':
        case 'ASSIGNED_USER':
            if (targetIds?.userId) {
                targetUserIds = [targetIds.userId];
            }
            break;
    }
    console.log('🎯 Target User IDs:', targetUserIds);
    if (excludeUserId) {
        targetUserIds = targetUserIds.filter(id => id !== excludeUserId);
        console.log('🧹 After excluding:', targetUserIds);
    }
    await Prisma_1.default.userNotification.createMany({
        data: targetUserIds.map(userId => ({
            userId,
            notificationId: notification.id
        })),
        skipDuplicates: true,
    });
    const io = (0, socket_1.getIO)();
    targetUserIds.forEach(userId => {
        console.log(`📣 Emitting to ${userId}`, {
            id: notification.id,
            title: notification.title,
            description: notification.message,
            createdAt: notification.createdAt,
        });
        io.to(userId).emit('new_notification', {
            id: notification.id,
            title: notification.title,
            description: notification.message,
            createdAt: notification.createdAt,
            showPopup: opts.showPopup || false,
        });
    });
    return notification;
}
// when someone submits a leave Req - notify managers (with HR tag), manager(if dept same), teamLead(if subdept same)
async function notifyLeaveApprovers({ employeeId, title, message, showPopup = false, }) {
    const io = (0, socket_1.getIO)();
    const employee = await Prisma_1.default.employee.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            departmentId: true,
            subDepartmentId: true,
        },
    });
    if (!employee)
        return;
    const departmentId = employee.departmentId;
    const subDepartmentId = employee.subDepartmentId;
    // 1. Find HRs
    const hrUsers = await Prisma_1.default.user.findMany({
        where: {
            role: { name: 'user' },
            subRole: { name: 'manager' },
            roleTag: "HR",
            status: 'ACTIVE',
        },
        select: { id: true },
    });
    // 2. Find Managers of same department
    const departmentManagers = await Prisma_1.default.user.findMany({
        where: {
            role: { name: 'user' },
            employee: { departmentId },
            status: 'ACTIVE',
            OR: [
                { subRole: { name: 'manager' } }, // Managers with role tag
                { subRole: null }, // Managers without role tag (assuming your system allows)
            ],
        },
        select: { id: true },
    });
    // 3. Find TeamLeads of same sub-department
    const subDeptLeads = await Prisma_1.default.user.findMany({
        where: {
            role: { name: 'user' },
            subRole: { name: 'teamLead' },
            employee: { subDepartmentId },
            status: 'ACTIVE',
        },
        select: { id: true },
    });
    const allTargetUserIds = new Set();
    [...hrUsers, ...departmentManagers, ...subDeptLeads].forEach(u => allTargetUserIds.add(u.id));
    // Create notification record
    const notif = await Prisma_1.default.notification.create({
        data: {
            title,
            message,
            type: 'info',
            employeeId,
            departmentId,
            subDepartmentId,
            visibilityLevel: 1, // custom level if needed
        },
    });
    // Associate with users
    await Prisma_1.default.userNotification.createMany({
        data: Array.from(allTargetUserIds).map(userId => ({
            userId,
            notificationId: notif.id,
        })),
        skipDuplicates: true,
    });
    // Emit to sockets
    Array.from(allTargetUserIds).forEach(userId => {
        io.to(userId).emit('new_notification', {
            id: notif.id,
            title: notif.title,
            description: notif.message,
            createdAt: notif.createdAt,
            showPopup: showPopup || false,
        });
    });
}
