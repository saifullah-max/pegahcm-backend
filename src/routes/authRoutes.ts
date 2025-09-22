import { Router } from 'express';
import { forgotPassword, login, register, resetPassword } from '../controllers/authController';

const router = Router();

router.post('/login', login as any);
router.post('/register', register as any);
router.post('/forgot-password', forgotPassword as any);
router.post('/reset-password/:token', resetPassword as any);

export default router;