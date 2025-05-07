import { Router } from 'express';
import { createRole, getRoles, getRoleById, updateRole, deleteRole } from '../controllers/roleController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Protected routes - require authentication
// router.use(authenticateToken as any);

router.post('/', createRole as any);
router.get('/', getRoles as any);
router.get('/:id', getRoleById as any);
router.put('/:id', updateRole as any);
router.delete('/:id', deleteRole as any);

export default router; 