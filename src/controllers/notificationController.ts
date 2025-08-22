import { Request, Response } from 'express';
import prisma from '../utils/Prisma';


export interface CustomJwtPayload {
    userId: string;
    role: string;
    subRole?: string;
    visibilityLevel?: number;
    departmentId?: string;
    subDepartmentId?: string;
}

// export const getUserNotifications = async (req: Request, res: Response) => {
//     try {
//         const user = req.user as CustomJwtPayload;

//         const {
//             userId,
//             role,
//             subRole,
//             visibilityLevel = 99,
//             departmentId,
//             subDepartmentId
//         } = user;

//         if (!userId) {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }

//         const notifications = await prisma.notification.findMany({
//             where: {
//                 OR: [
//                     { userId },

//                     // ✅ Removed `scope` — doesn't exist in schema, so should not be here

//                     {
//                         visibilityLevel: {
//                             lte: visibilityLevel
//                         }
//                     },
//                     {
//                         departmentId: departmentId ?? undefined
//                     },
//                     {
//                         subDepartmentId: subDepartmentId ?? undefined
//                     }
//                 ]
//             },
//             orderBy: {
//                 createdAt: 'desc'
//             }
//         });

//         res.status(200).json(notifications);
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };

// GET /api/notifications?page=1&limit=10

export const getFilteredNotifications = async (req: Request, res: Response) => {
    try {
        const user = req.user as CustomJwtPayload;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const userNotifications = await prisma.userNotification.findMany({
            where: {
                userId: user.userId,
            },
            include: {
                notification: true,
            },
            orderBy: {
                notification: {
                    createdAt: 'desc',
                },
            },
            skip,
            take: limit,
        });

        const total = await prisma.userNotification.count({
            where: { userId: user.userId },
        });

        res.status(200).json({
            data: userNotifications,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// to mark as read - single notif
export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const { id: notificationId } = req.params;
        const user = req.user as CustomJwtPayload;

        const userNotif = await prisma.userNotification.findFirst({
            where: {
                notificationId,
                userId: user.userId,
            },
        });

        if (!userNotif) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (userNotif.read) {
            return res.status(200).json({ message: 'Already marked as read' });
        }

        await prisma.userNotification.update({
            where: { id: userNotif.id },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// to marks as read - filtering notif on frontend to show one notif as a teamLead belongs to subDept and dept then 2 notifs created and visible
export const markGroupNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const { title, message, type } = req.body;
        const user = req.user as CustomJwtPayload;

        if (!title || !message || !type) {
            return res.status(400).json({ message: 'title, message, and type are required' });
        }

        const groupNotifs = await prisma.userNotification.findMany({
            where: {
                userId: user.userId,
                notification: {
                    title,
                    message,
                    type,
                },
                read: false,
            },
        });

        const updates = groupNotifs.map((n) =>
            prisma.userNotification.update({
                where: { id: n.id },
                data: { read: true, readAt: new Date() },
            })
        );

        await prisma.$transaction(updates);

        res.status(200).json({ message: 'Group notifications marked as read' });
    } catch (error) {
        console.error('Error in markGroupNotificationsAsRead:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//to mark all notifs are read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const user = req.user as CustomJwtPayload;

        await prisma.userNotification.updateMany({
            where: {
                userId: user.userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

