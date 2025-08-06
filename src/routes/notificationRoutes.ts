import express from 'express';
import { checkPermission } from '../middlewares/checkPermissions';
import { authenticateToken } from '../middlewares/authMiddleware';
import { getUserNotifications, getVisibleNotificationsForUser } from '../controllers/notificationController';

const router = express.Router();

router.use(authenticateToken as any)

router.get('/', checkPermission("Notification", "view"), getUserNotifications as any)

router.get('/visible', checkPermission("Notification", "view"), getVisibleNotificationsForUser as any)

export default router;