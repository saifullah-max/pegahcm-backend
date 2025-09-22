import { Router } from 'express';
import { createEmployee, listEmployees, listInactiveUsers, ListSingleEmployee, updateEmployee, updateEmployeeInfoByEmployee } from '../controllers/employeeController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { isAdmin, isAdminOrHR } from '../middlewares/roleMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { submitResignation } from '../controllers/resignationController';
import { checkPermission } from '../middlewares/checkPermissions';

const router = Router();

// Protected routes - require authentication and admin role
router.use(authenticateToken as any);

// submit resignation
router.post('/resignation/apply', checkPermission("Resignation", "create"), submitResignation as any);

router.get('/', listEmployees as any)

// getting a specific employee by ID
router.get('/:id', checkPermission("Employee", "view"), ListSingleEmployee as any);

// update only phone and email by employee
router.patch('/update-contact', uploadMiddleware, checkPermission("Employee", "view"), updateEmployeeInfoByEmployee as any)

// Create employee with file uploads and image processing
router.post('/', uploadMiddleware, createEmployee as any);

// Update employee
router.put('/:id', uploadMiddleware, checkPermission("Employee", "update"), updateEmployee as any); // Reusing createEmployee for updates, adjust as needed

// Delete employee
// router.delete('/:id', checkPermission("Employee", "delete"), deleteEmployee as any);

router.get('/users/inactive', checkPermission("Employee", "delete"), listInactiveUsers as any);


// Delete user 
// router.delete('/user/delete/:userId', checkPermission("Employee", "delete"), deleteUser as any)

// upload employee image
// router.post('/image', uploadMiddleware, checkPermission("Employee", "create"), uploadImage as any); // Endpoint to upload an employee image

// upload docs
// router.post('/documents', uploadMiddleware, checkPermission("Employee", "create"), uploadEmployeeDocuments as any);

export default router;