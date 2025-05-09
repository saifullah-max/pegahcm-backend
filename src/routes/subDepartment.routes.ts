import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import {
  createSubDepartment,
  getAllSubDepartments,
  getSubDepartmentById,
  updateSubDepartment,
  deleteSubDepartment
} from '../controllers/subDepartmentController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Sub-department routes
router.post('/', createSubDepartment as any);
router.get('/', getAllSubDepartments as any);
router.get('/:id', getSubDepartmentById as any);
router.put('/:id', updateSubDepartment as any);
router.delete('/:id', deleteSubDepartment as any);

export default router; 