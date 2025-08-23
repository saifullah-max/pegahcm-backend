"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController_1 = require("../controllers/employeeController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const resignationController_1 = require("../controllers/resignationController");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const router = (0, express_1.Router)();
// Protected routes - require authentication and admin role
router.use(authMiddleware_1.authenticateToken);
// submit resignation
router.post('/resignation/apply', (0, checkPermissions_1.checkPermission)("Resignation", "create"), resignationController_1.submitResignation);
router.get('/', (0, checkPermissions_1.checkPermission)("Employee", "view-all"), employeeController_1.listEmployees);
// getting a specific employee by ID
router.get('/:id', (0, checkPermissions_1.checkPermission)("Employee", "view"), employeeController_1.ListSingleEmployee);
// update only phone and email by employee
router.patch('/update-contact', uploadMiddleware_1.uploadMiddleware, (0, checkPermissions_1.checkPermission)("Employee", "view"), employeeController_1.updateEmployeeInfoByEmployee);
// Create employee with file uploads and image processing
router.post('/', uploadMiddleware_1.uploadMiddleware, (0, checkPermissions_1.checkPermission)("Employee", "create"), employeeController_1.createEmployee);
// Update employee
router.put('/:id', uploadMiddleware_1.uploadMiddleware, (0, checkPermissions_1.checkPermission)("Employee", "update"), employeeController_1.updateEmployee); // Reusing createEmployee for updates, adjust as needed
// Delete employee
// router.delete('/:id', checkPermission("Employee", "delete"), deleteEmployee as any);
router.get('/users/inactive', (0, checkPermissions_1.checkPermission)("Employee", "delete"), employeeController_1.listInactiveUsers);
// Delete user 
// router.delete('/user/delete/:userId', checkPermission("Employee", "delete"), deleteUser as any)
// upload employee image
// router.post('/image', uploadMiddleware, checkPermission("Employee", "create"), uploadImage as any); // Endpoint to upload an employee image
// upload docs
// router.post('/documents', uploadMiddleware, checkPermission("Employee", "create"), uploadEmployeeDocuments as any);
exports.default = router;
