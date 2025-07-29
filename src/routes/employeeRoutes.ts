import { Router } from 'express';
import { createEmployee, deleteEmployee, listEmployees, ListSingleEmployee, updateEmployee, uploadEmployeeDocuments, uploadImage } from '../controllers/employeeController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { isAdmin, isAdminOrHR } from '../middlewares/roleMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { submitResignation } from '../controllers/resignationController';

const router = Router();

// Protected routes - require authentication and admin role
router.use(authenticateToken as any);
// submit resignation
router.post('/resignation/apply', submitResignation as any);

router.get('/', isAdminOrHR as any, listEmployees as any);


router.use(isAdmin as any);

// Create employee with file uploads and image processing
router.post('/', uploadMiddleware, createEmployee as any);

// List employees

router.get('/:id', ListSingleEmployee as any); // Assuming this is for getting a specific employee by ID

// Update employee
router.put('/:id', uploadMiddleware, updateEmployee as any); // Reusing createEmployee for updates, adjust as needed

// Delete employee
router.delete('/:id', deleteEmployee as any);

// upload employee image
router.post('/image', uploadMiddleware, uploadImage as any); // Endpoint to upload an employee image

// upload docs
router.post('/documents', uploadMiddleware, uploadEmployeeDocuments as any);

export default router;