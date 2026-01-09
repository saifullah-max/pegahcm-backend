import express from 'express';
import { assignPermissionsToUser, createPermission, getAllPermissions, getPermissionIdOfUser, getPermissionsOfRole, getPermissionsOfUser } from '../controllers/permissionController';
import { checkPermission } from '../middlewares/checkPermissions';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateToken as any)
// checkPermission("Permission", "create"),
router.post("/", checkPermission("Permission", "create"), createPermission as any)

router.get('/', checkPermission("Permission", "view"), getAllPermissions as any)

router.get('/:RoleId', checkPermission("Permission", "view"), getPermissionsOfRole as any)

router.post('/user', checkPermission("Permission", "create"), assignPermissionsToUser as any)

router.get('/user/:userId', checkPermission("Permission", "view",), getPermissionsOfUser as any)

router.get('/id/user/:userId', checkPermission("Permission", "view"), getPermissionIdOfUser as any)
export default router;
