import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import {
  createSubDepartment,
  getAllSubDepartments,
  getSubDepartmentById,
  updateSubDepartment,
  deleteSubDepartment
} from '../controllers/subDepartmentController';
import { checkPermission } from '../middlewares/checkPermissions';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Sub-department routes
router.post('/', checkPermission("SubDepartment", "create"), createSubDepartment as any);
router.get('/', checkPermission("SubDepartment", "view"), getAllSubDepartments as any);
router.get('/:id', checkPermission("SubDepartment", "view"), getSubDepartmentById as any);
router.put('/:id', checkPermission("SubDepartment", "update"), updateSubDepartment as any);
router.delete('/:id', checkPermission("SubDepartment", "delete"), deleteSubDepartment as any);

export default router; 