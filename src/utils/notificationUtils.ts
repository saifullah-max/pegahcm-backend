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
            role: true
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
        // (employee logic removed)

        // 3. Visibility Scopes
        switch (notification.visibility_level) {
            case 0: // Only Admins
                return user.role.name === 'admin';
            case 1: // All users with role 'user'
                return user.role.name === 'user';
            case 2: // Department-based (removed)
            case 3: // Sub-department-based (removed)
                return false;
            case 4: // All users
                return true;
            default:
                return false;
        }
    });

    console.log("🔔 NOTIFICATION LOGS:");
    console.log({
        userId: user.id,
        role: user.role.name
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
                    role_tag: "HR",
                    status: 'ACTIVE'
                },
                select: { id: true }
            })).map(u => u.id);
            break;
        case 'MANAGERS_DEPT':
        case 'TEAMLEADS_SUBDEPT':
            // No-op: sub_role/employee logic removed
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

    // All sub_role/employee logic removed. No notifications sent.
}