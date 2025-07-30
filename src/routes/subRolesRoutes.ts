import { Router } from 'express';
import { assignPermissionsToSubRole, createSubRole, deleteSubRole, getAllSubRoles, getSubRoleById, updateSubRole } from '../controllers/subRoleController';

const router = Router();

router.post('/', createSubRole as any);

router.get('/all', getAllSubRoles as any);

router.get('/', getSubRoleById as any);

router.put('/:id', updateSubRole as any);

router.delete('/:id', deleteSubRole as any)

router.post('/permission', assignPermissionsToSubRole as any);


export default router; 