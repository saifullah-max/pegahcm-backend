import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { createSalary, updateSalary, deleteSalary, getAllSalaries, getSalaryById, getMySalary, copyPreviousSalaryByEmployee, getSalarySlip } from '../controllers/salaryController';
import { checkPermission } from '../middlewares/checkPermissions';
import { canAccessSalary } from '../middlewares/canAccessFinance';

const router = express.Router();

router.use(authenticateToken as any)

// Normal user own salary
router.get('/my', checkPermission("Salary", "view"), getMySalary as any);
router.get('/download/:employeeId', checkPermission("Salary", "view"), getSalarySlip as any)

router.use(canAccessSalary as any)

// Admin & finance managers
router.post('/', checkPermission("Salary", "create"), createSalary as any);
router.put('/:id', checkPermission("Salary", "update"), updateSalary as any);
router.delete('/:id', checkPermission("Salary", "delete"), deleteSalary as any);
router.get('/', checkPermission("Salary", "view-all"), getAllSalaries as any);
router.get('/:id', checkPermission("Salary", "view"), getSalaryById as any);

router.post('/copy/:employeeId', checkPermission("Salary", "create"), copyPreviousSalaryByEmployee as any)

export default router;
