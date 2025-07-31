import { Router } from 'express';
import { assignPermissionsToSubRole, createSubRole, deleteSubRole, getAllSubRoles, getSubRoleById, updateSubRole } from '../controllers/subRoleController';
import { checkPermission } from '../middlewares/checkPermissions';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(authenticateToken as any);

router.post('/', checkPermission("SubRole", "create"),createSubRole as any);

router.get('/all', checkPermission("SubRole", "view"),getAllSubRoles as any);

router.get('/', checkPermission("SubRole", "view"),getSubRoleById as any);

router.put('/:id', checkPermission("SubRole", "update"),updateSubRole as any);

router.delete('/:id', checkPermission("SubRole", "delete"),deleteSubRole as any)

router.post('/permission', checkPermission("SubRole", "create"),assignPermissionsToSubRole as any);


export default router; 