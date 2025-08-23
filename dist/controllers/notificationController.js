"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markGroupNotificationsAsRead = exports.markNotificationAsRead = exports.getFilteredNotifications = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
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
const getFilteredNotifications = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userNotifications = await Prisma_1.default.userNotification.findMany({
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
        const total = await Prisma_1.default.userNotification.count({
            where: { userId: user.userId },
        });
        res.status(200).json({
            data: userNotifications,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getFilteredNotifications = getFilteredNotifications;
// to mark as read - single notif
const markNotificationAsRead = async (req, res) => {
    try {
        const { id: notificationId } = req.params;
        const user = req.user;
        const userNotif = await Prisma_1.default.userNotification.findFirst({
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
        await Prisma_1.default.userNotification.update({
            where: { id: userNotif.id },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
        res.status(200).json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// to marks as read - filtering notif on frontend to show one notif as a teamLead belongs to subDept and dept then 2 notifs created and visible
const markGroupNotificationsAsRead = async (req, res) => {
    try {
        const { title, message, type } = req.body;
        const user = req.user;
        if (!title || !message || !type) {
            return res.status(400).json({ message: 'title, message, and type are required' });
        }
        const groupNotifs = await Prisma_1.default.userNotification.findMany({
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
        const updates = groupNotifs.map((n) => Prisma_1.default.userNotification.update({
            where: { id: n.id },
            data: { read: true, readAt: new Date() },
        }));
        await Prisma_1.default.$transaction(updates);
        res.status(200).json({ message: 'Group notifications marked as read' });
    }
    catch (error) {
        console.error('Error in markGroupNotificationsAsRead:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.markGroupNotificationsAsRead = markGroupNotificationsAsRead;
//to mark all notifs are read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const user = req.user;
        await Prisma_1.default.userNotification.updateMany({
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
    }
    catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
