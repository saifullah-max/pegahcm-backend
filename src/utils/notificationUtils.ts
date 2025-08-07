import { Prisma, PrismaClient } from "@prisma/client";

// utils/notificationUtils.ts
const prisma = new PrismaClient();

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
}

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
                    subRole: { name: { in: ['director', 'hr'] } },
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

    return notification;
}