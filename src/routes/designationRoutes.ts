import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';
import { createDesignation, deleteDesignation, getDesignationById, getDesignations, updateDesignation } from '../controllers/designationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Department routes
router.post('/', checkPermission("Designation", "create"), createDesignation as any);
router.get('/', checkPermission("Designation", "view"), getDesignations as any);
router.get('/:id', checkPermission("Designation", "view"), getDesignationById as any);
router.put('/:id', checkPermission("Designation", "update"), updateDesignation as any);
router.put('/:id', checkPermission("Designation", "delete"), deleteDesignation as any);

export default router; 