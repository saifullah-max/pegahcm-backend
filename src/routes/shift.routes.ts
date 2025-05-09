import { Router } from 'express';
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift
} from '../controllers/shift.controller';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Shift routes
router.post('/', createShift as any);
router.get('/', getAllShifts as any);
router.get('/:id', getShiftById as any);
router.put('/:id', updateShift as any);
router.delete('/:id', deleteShift as any);

export default router; 