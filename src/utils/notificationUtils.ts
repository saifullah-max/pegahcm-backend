import { getIO } from '../utils/socket';
import prisma from "./Prisma";

// utils/notificationUtils.ts
interface NotifyOptions {
    scope: VisibilityScope;
    data: { title: string; message: string; type: string };
    target_ids?: {
        user_id?: string;
        employee_id?: string;
        department_id?: string;
        sub_department_id?: string;
    };
    visibilityLevel?: number; // Optional override
    excludeUserId?: string;
    showPopup?: boolean;
}
interface NotifyRelevantApproversOptions {
    employee_id: string;
    title: string;
    message: string;
    showPopup?: boolean;
}

export async function getVisibleNotificationsForUser(userId: string) {
    // console.log("🔍 getVisibleNotificationsForUser called with:", userId); // ✅ Add this
    const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
            role: true,
            sub_role: true,
            employee: {
                select: {
                    id: true,
                    department_id: true,
                    sub_department_id: true,
                },
            },
        },
    });

    if (!user || !user.role || user.status === 'INACTIVE') {
        return [];
    }

    const allNotifications = await prisma.notifications.findMany({
        orderBy: { created_at: 'desc' },
    });

    const visibleNotifications = allNotifications.filter((notification) => {
        // 1. If it's a personal notification
        if (notification.user_id === user.id) return true;

        // 2. Exclude notifications about the user themselves (e.g., new employee joined)
        if (notification.employee_id && notification.employee_id === user.employee?.id) {
            return false;
        }

        // 3. Visibility Scopes
        switch (notification.visibility_level) {
            case 0: // Only Admins
                return user.role.name === 'admin';

            case 1: // Director, Manager, TeamLead
                return (
                    user.role.name === 'user' &&
                    ['director', 'manager', 'teamLead'].includes(user.sub_role?.name || '')
                );

            case 2: // Department-based
                return (
                    user.employee?.department_id &&
                    user.employee.department_id === notification.department_id
                );

            case 3: // Sub-department-based
                return (
                    user.employee?.sub_department_id &&
                    user.employee.sub_department_id === notification.sub_department_id
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
        subRole: user.sub_role?.name,
        employeeId: user.employee?.id,
        departmentId: user.employee?.department_id,
        subDepartmentId: user.employee?.sub_department_id,
    });

    return visibleNotifications;
}

type VisibilityScope = 'ADMIN_ONLY' | 'DIRECTORS_HR' | 'MANAGERS_DEPT' | 'TEAMLEADS_SUBDEPT' | 'EMPLOYEE_ONLY' | 'ASSIGNED_USER';

// utils/notificationUtils.ts
export async function createScopedNotification(opts: NotifyOptions) {
    const { scope, data, target_ids, visibilityLevel, excludeUserId } = opts;

    console.log('📥 Incoming Notification Options:', opts);

    const notification = await prisma.notifications.create({
        data: {
            ...data,
            user_id: target_ids?.user_id,
            employee_id: target_ids?.employee_id,
            department_id: target_ids?.department_id,
            sub_department_id: target_ids?.sub_department_id,
            visibility_level: visibilityLevel
        }
    });

    console.log('✅ Notification Created:', notification.id);

    let targetUserIds: string[] = [];

    switch (scope) {
        case 'ADMIN_ONLY':
            targetUserIds = (await prisma.users.findMany({
                where: { role: { name: 'admin' }, status: 'ACTIVE' },
                select: { id: true }
            })).map(u => u.id);
            break;

        case 'DIRECTORS_HR':
            targetUserIds = (await prisma.users.findMany({
                where: {
                    role: { name: 'user' },
                    sub_role: { name: { in: ['director', 'manager'] } },
                    role_tag: "HR",
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;

        case 'MANAGERS_DEPT':
            if (!target_ids?.department_id) break;
            targetUserIds = (await prisma.users.findMany({
                where: {
                    employee: {
                        department_id: target_ids.department_id
                    },
                    sub_role: {
                        name: { in: ['manager'] }
                    },
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;

        case 'TEAMLEADS_SUBDEPT':
            if (!target_ids?.sub_department_id) break;
            targetUserIds = (await prisma.users.findMany({
                where: {
                    employee: {
                        sub_department_id: target_ids.sub_department_id
                    },
                    sub_role: {
                        name: { in: ['teamLead'] }
                    },
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;

        case 'EMPLOYEE_ONLY':
        case 'ASSIGNED_USER':
            if (target_ids?.user_id) {
                targetUserIds = [target_ids.user_id];
            }
            break;
    }
    console.log('🎯 Target User IDs:', targetUserIds);

    if (excludeUserId) {
        targetUserIds = targetUserIds.filter(id => id !== excludeUserId);
        console.log('🧹 After excluding:', targetUserIds);
    }

    await prisma.user_notifications.createMany({
        data: targetUserIds.map(userId => ({
            user_id: userId,
            notification_id: notification.id
        })),
        skipDuplicates: true,
    });

    const io = getIO();
    targetUserIds.forEach(userId => {
        console.log(`📣 Emitting to ${userId}`, {
            id: notification.id,
            title: notification.title,
            description: notification.message,
            createdAt: notification.created_at,
        });

        io.to(userId).emit('new_notification', {
            id: notification.id,
            title: notification.title,
            description: notification.message,
            createdAt: notification.created_at,
            showPopup: opts.showPopup || false,
        });
    });

    return notification;
}

// when someone submits a leave Req - notify managers (with HR tag), manager(if dept same), teamLead(if subdept same)
export async function notifyLeaveApprovers({
    employee_id,
    title,
    message,
    showPopup = false,
}: NotifyRelevantApproversOptions) {
    const io = getIO();

    const employee = await prisma.employees.findUnique({
        where: { id: employee_id },
        select: {
            id: true,
            department_id: true,
            sub_department_id: true,
        },
    });

    if (!employee) return;

    const departmentId = employee.department_id;
    const subDepartmentId = employee.sub_department_id;

    // 1. Find HRs
    const hrUsers = await prisma.users.findMany({
        where: {
            role: { name: 'user' },
            sub_role: { name: 'manager' },
            role_tag: "HR",
            status: 'ACTIVE',
        },
        select: { id: true },
    });

    // 2. Find Managers of same department
    const departmentManagers = await prisma.users.findMany({
        where: {
            role: { name: 'user' },
            employee: { department_id: departmentId },
            status: 'ACTIVE',
            OR: [
                { sub_role: { name: 'manager' } }, // Managers with role tag
                { sub_role: null }, // Managers without role tag (assuming your system allows)
            ],
        },
        select: { id: true },
    });

    // 3. Find TeamLeads of same sub-department
    const subDeptLeads = await prisma.users.findMany({
        where: {
            role: { name: 'user' },
            sub_role: { name: 'teamLead' },
            employee: { sub_department_id: subDepartmentId },
            status: 'ACTIVE',
        },
        select: { id: true },
    });

    const allTargetUserIds = new Set<string>();
    [...hrUsers, ...departmentManagers, ...subDeptLeads].forEach(u => allTargetUserIds.add(u.id));

    // Create notification record
    const notif = await prisma.notifications.create({
        data: {
            title,
            message,
            type: 'info',
            employee_id: employee_id,
            department_id: departmentId,
            sub_department_id: subDepartmentId,
            visibility_level: 1, // custom level if needed
        },
    });

    // Associate with users
    await prisma.user_notifications.createMany({
        data: Array.from(allTargetUserIds).map(userId => ({
            user_id: userId,
            notification_id: notif.id,
        })),
        skipDuplicates: true,
    });

    // Emit to sockets
    Array.from(allTargetUserIds).forEach(userId => {
        io.to(userId).emit('new_notification', {
            id: notif.id,
            title: notif.title,
            description: notif.message,
            createdAt: notif.created_at,
            showPopup: showPopup || false,
        });
    });
}