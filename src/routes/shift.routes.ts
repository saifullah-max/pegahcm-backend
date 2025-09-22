import { Router } from 'express';
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift
} from '../controllers/shift.controller';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/checkPermissions';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Shift routes
router.post('/', checkPermission("Shift", "create"), createShift as any);
router.get('/', checkPermission("Shift", "view"), getAllShifts as any);
router.get('/:id', checkPermission("Shift", "view"), getShiftById as any);
router.put('/:id', checkPermission("Shift", "update"), updateShift as any);
router.delete('/:id', checkPermission("Shift", "delete"), deleteShift as any);

export default router; 