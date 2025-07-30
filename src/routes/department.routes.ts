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
router.post('/',checkPermission("Department", "create"), createDepartment as any);
router.get('/', getAllDepartments as any);
router.get('/:id', getDepartmentById as any);
router.put('/:id', updateDepartment as any);
router.delete('/:id', deleteDepartment as any);

export default router; 