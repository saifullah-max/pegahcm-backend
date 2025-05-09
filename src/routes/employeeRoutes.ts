import { Router } from 'express';
import { createEmployee, listEmployees } from '../controllers/employeeController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { isAdmin } from '../middlewares/roleMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = Router();

// Protected routes - require authentication and admin role
router.use(authenticateToken as any);
router.use(isAdmin as any);

// Create employee with file uploads and image processing
router.post('/', uploadMiddleware, createEmployee as any);

// List employees
router.get('/', listEmployees as any);

export default router; 