import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export interface CustomJwtPayload {
    userId: string;
    role: string;
    subRole?: string;
    visibilityLevel?: number;
    departmentId?: string;
    subDepartmentId?: string;
}

export const getUserNotifications = async (req: Request, res: Response) => {
    try {
        const user = req.user as CustomJwtPayload;

        const {
            userId,
            role,
            subRole,
            visibilityLevel = 99,
            departmentId,
            subDepartmentId
        } = user;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { userId },

                    // ✅ Removed `scope` — doesn't exist in schema, so should not be here

                    {
                        visibilityLevel: {
                            lte: visibilityLevel
                        }
                    },
                    {
                        departmentId: departmentId ?? undefined
                    },
                    {
                        subDepartmentId: subDepartmentId ?? undefined
                    }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export async function getVisibleNotificationsForUser(userId: string) {
    console.log("🔍 getVisibleNotificationsForUser called with:", userId); // ✅ Add this
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
