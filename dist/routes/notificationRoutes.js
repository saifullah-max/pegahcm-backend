"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkPermissions_1 = require("../middlewares/checkPermissions");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/visible', (0, checkPermissions_1.checkPermission)("Notification", "view"), notificationController_1.getFilteredNotifications);
router.patch('/:id/read', (0, checkPermissions_1.checkPermission)("Notification", "view"), notificationController_1.markNotificationAsRead);
router.patch('/mark-group', (0, checkPermissions_1.checkPermission)("Notification", "view"), notificationController_1.markGroupNotificationsAsRead);
router.patch('/all', (0, checkPermissions_1.checkPermission)("Notification", "view"), notificationController_1.markAllNotificationsAsRead);
exports.default = router;
