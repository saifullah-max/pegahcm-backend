import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { impersonateUser } from '../controllers/impersonateController';
import { checkPermission } from '../middlewares/checkPermissions';
const router = Router();

router.use(authenticateToken as any);

router.post('/:userId', checkPermission("Impersonate", "view"),impersonateUser as any);

export default router;