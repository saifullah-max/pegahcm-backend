"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const salaryController_1 = require("../controllers/salaryController");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const canAccessFinance_1 = require("../middlewares/canAccessFinance");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
// Normal user own salary
router.get('/my', (0, checkPermissions_1.checkPermission)("Salary", "view"), salaryController_1.getMySalary);
router.get('/download/:employeeId', (0, checkPermissions_1.checkPermission)("Salary", "view"), salaryController_1.getSalarySlip);
router.use(canAccessFinance_1.canAccessSalary);
// Admin & finance managers
router.post('/', (0, checkPermissions_1.checkPermission)("Salary", "create"), salaryController_1.createSalary);
router.put('/:id', (0, checkPermissions_1.checkPermission)("Salary", "update"), salaryController_1.updateSalary);
router.delete('/:id', (0, checkPermissions_1.checkPermission)("Salary", "delete"), salaryController_1.deleteSalary);
router.get('/', (0, checkPermissions_1.checkPermission)("Salary", "view-all"), salaryController_1.getAllSalaries);
router.get('/:id', (0, checkPermissions_1.checkPermission)("Salary", "view"), salaryController_1.getSalaryById);
router.post('/copy/:employeeId', (0, checkPermissions_1.checkPermission)("Salary", "create"), salaryController_1.copyPreviousSalaryByEmployee);
exports.default = router;
