import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController';
import { checkPermission } from '../middlewares/checkPermissions';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Department routes
router.post('/', checkPermission("Department", "create"), createDepartment as any);
router.get('/', checkPermission("Department", "view"), getAllDepartments as any);
router.get('/:id', checkPermission("Department", "view"), getDepartmentById as any);
router.put('/:id', checkPermission("Department", "update"), updateDepartment as any);
router.delete('/:id', checkPermission("Department", "delete"), deleteDepartment as any);

export default router; 