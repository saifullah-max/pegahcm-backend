"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const subDepartmentController_1 = require("../controllers/subDepartmentController");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(authMiddleware_1.authenticateToken);
// Sub-department routes
router.post('/', (0, checkPermissions_1.checkPermission)("SubDepartment", "create"), subDepartmentController_1.createSubDepartment);
router.get('/', (0, checkPermissions_1.checkPermission)("SubDepartment", "view"), subDepartmentController_1.getAllSubDepartments);
router.get('/:id', (0, checkPermissions_1.checkPermission)("SubDepartment", "view"), subDepartmentController_1.getSubDepartmentById);
router.put('/:id', (0, checkPermissions_1.checkPermission)("SubDepartment", "update"), subDepartmentController_1.updateSubDepartment);
router.delete('/:id', (0, checkPermissions_1.checkPermission)("SubDepartment", "delete"), subDepartmentController_1.deleteSubDepartment);
exports.default = router;
