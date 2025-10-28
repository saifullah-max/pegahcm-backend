import { Router } from 'express';
import { createRole, getRoles, getRoleById, updateRole, deleteRole, assignPermissionsToRole } from '../controllers/roleController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';

const router = Router();

// Protected routes - require authentication
router.use(authenticateToken as any);

router.post('/', checkPermission("Role", "create"), createRole as any);
router.get('/', checkPermission("Role", "view"), getRoles as any);
router.get('/:id', checkPermission("Role", "view"), getRoleById as any);
router.put('/:id', checkPermission("Role", "update"), updateRole as any);
router.delete('/:id', checkPermission("Role", "delete"), deleteRole as any);

router.post('/permission', checkPermission("Role", "create"), assignPermissionsToRole as any);


export default router; 