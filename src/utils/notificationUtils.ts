import { Prisma, PrismaClient } from "@prisma/client";
import { getIO } from '../utils/socket';

// utils/notificationUtils.ts
const prisma = new PrismaClient();
interface NotifyOptions {
    scope: VisibilityScope;
    data: { title: string; message: string; type: string };
    targetIds?: {
        userId?: string;
        employeeId?: string;
        departmentId?: string;
        subDepartmentId?: string;
    };
    visibilityLevel?: number; // Optional override
    excludeUserId?: string;
    showPopup?: boolean;
}
interface NotifyRelevantApproversOptions {
    employeeId: string;
    title: string;
    message: string;
    showPopup?: boolean;
}

export async function getVisibleNotificationsForUser(userId: string) {
    // console.log("🔍 getVisibleNotificationsForUser called with:", userId); // ✅ Add this
    const user = await prisma.user.findUnique({
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

    const allNotifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const visibleNotifications = allNotifications.filter((notification) => {
        // 1. If it's a personal notification
        if (notification.userId === user.id) return true;

        // 2. Exclude notifications about the user themselves (e.g., new employee joined)
        if (notification.employeeId && notification.employeeId === user.employee?.id) {
            return false;
        }

        // 3. Visibility Scopes
        switch (notification.visibilityLevel) {
            case 0: // Only Admins
                return user.role.name === 'admin';

            case 1: // Director, Manager, TeamLead
                return (
                    user.role.name === 'user' &&
                    ['director', 'manager', 'teamLead'].includes(user.subRole?.name || '')
                );

            case 2: // Department-based
                return (
                    user.employee?.departmentId &&
                    user.employee.departmentId === notification.departmentId
                );

            case 3: // Sub-department-based
                return (
                    user.employee?.subDepartmentId &&
                    user.employee.subDepartmentId === notification.subDepartmentId
                );

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

type VisibilityScope = 'ADMIN_ONLY' | 'DIRECTORS_HR' | 'MANAGERS_DEPT' | 'TEAMLEADS_SUBDEPT' | 'EMPLOYEE_ONLY' | 'ASSIGNED_USER';

// utils/notificationUtils.ts
export async function createScopedNotification(opts: NotifyOptions) {
    const { scope, data, targetIds, visibilityLevel, excludeUserId } = opts;

    const notification = await prisma.notification.create({
        data: {
            ...data,
            userId: targetIds?.userId,
            employeeId: targetIds?.employeeId,
            departmentId: targetIds?.departmentId,
            subDepartmentId: targetIds?.subDepartmentId,
            visibilityLevel,
        }
    });

    let targetUserIds: string[] = [];

    switch (scope) {
        case 'ADMIN_ONLY':
            targetUserIds = (await prisma.user.findMany({
                where: { role: { name: 'admin' }, status: 'ACTIVE' },
                select: { id: true }
            })).map(u => u.id);
            break;

        case 'DIRECTORS_HR':
            targetUserIds = (await prisma.user.findMany({
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
            if (!targetIds?.departmentId) break;
            targetUserIds = (await prisma.user.findMany({
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
            if (!targetIds?.subDepartmentId) break;
            targetUserIds = (await prisma.user.findMany({
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

    if (excludeUserId) {
        targetUserIds = targetUserIds.filter(id => id !== excludeUserId);
    }

    await prisma.userNotification.createMany({
        data: targetUserIds.map(userId => ({
            userId,
            notificationId: notification.id
        })),
        skipDuplicates: true,
    });

    const io = getIO();
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
export async function notifyLeaveApprovers({
    employeeId,
    title,
    message,
    showPopup = false,
}: NotifyRelevantApproversOptions) {
    const prisma = new PrismaClient();
    const io = getIO();

    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            departmentId: true,
            subDepartmentId: true,
        },
    });

    if (!employee) return;

    const departmentId = employee.departmentId;
    const subDepartmentId = employee.subDepartmentId;

    // 1. Find HRs
    const hrUsers = await prisma.user.findMany({
        where: {
            role: { name: 'user' },
            subRole: { name: 'manager' },
            roleTag: "HR",
            status: 'ACTIVE',
        },
        select: { id: true },
    });

    // 2. Find Managers of same department
    const departmentManagers = await prisma.user.findMany({
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
    const subDeptLeads = await prisma.user.findMany({
        where: {
            role: { name: 'user' },
            subRole: { name: 'teamLead' },
            employee: { subDepartmentId },
            status: 'ACTIVE',
        },
        select: { id: true },
    });

    const allTargetUserIds = new Set<string>();
    [...hrUsers, ...departmentManagers, ...subDeptLeads].forEach(u => allTargetUserIds.add(u.id));

    // Create notification record
    const notif = await prisma.notification.create({
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
    await prisma.userNotification.createMany({
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