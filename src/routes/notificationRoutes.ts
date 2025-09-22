import express from 'express';
import { checkPermission } from '../middlewares/checkPermissions';
import { authenticateToken } from '../middlewares/authMiddleware';
import { getFilteredNotifications, markAllNotificationsAsRead, markGroupNotificationsAsRead, markNotificationAsRead } from '../controllers/notificationController';

const router = express.Router();

router.use(authenticateToken as any)

router.get('/visible', checkPermission("Notification", "view"), getFilteredNotifications as any)

router.patch('/:id/read', checkPermission("Notification", "view"), markNotificationAsRead as any)

router.patch('/mark-group', checkPermission("Notification", "view"), markGroupNotificationsAsRead as any)

router.patch('/all', checkPermission("Notification", "view"), markAllNotificationsAsRead as any)

export default router;