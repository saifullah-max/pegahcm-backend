import { Router } from 'express';
import { ListSingleEmployee } from '../controllers/employeeController';
import { checkPermission } from '../middlewares/checkPermissions';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken as any)

router.get('/:id', checkPermission("Employee", "view"), ListSingleEmployee as any); 

export default router;