import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';
import { createDesignation, deleteDesignation, getDesignationById, getDesignations, updateDesignation } from '../controllers/designationController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Department routes
router.post('/', checkPermission("Department", "create"), createDesignation as any);
router.get('/', checkPermission("Department", "view"), getDesignations as any);
router.get('/:id', checkPermission("Department", "view"), getDesignationById as any);
router.put('/:id', checkPermission("Department", "update"), updateDesignation as any);
router.put('/:id', checkPermission("Department", "delete"), deleteDesignation as any);

export default router; 