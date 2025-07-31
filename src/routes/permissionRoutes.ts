import express from 'express';
import { assignPermissionsToUser, createPermission, getAllPermissions, getPermissionsOfSubRole, updateSubRolePermissions } from '../controllers/permissionController';
import { checkPermission } from '../middlewares/checkPermissions';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateToken as any)
// checkPermission("Permission", "create"),
router.post("/", createPermission as any)

router.get('/', checkPermission("Permission", "view"), getAllPermissions as any)

router.get('/:subRoleId', checkPermission("Permission", "view"), getPermissionsOfSubRole as any)

router.put('/sub-role/:subRoleId', checkPermission("Permission", "update"), updateSubRolePermissions as any)

router.post('/user', checkPermission("Permission", "create"), assignPermissionsToUser as any)

export default router;
