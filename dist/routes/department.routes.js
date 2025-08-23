"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const departmentController_1 = require("../controllers/departmentController");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(authMiddleware_1.authenticateToken);
// Department routes
router.post('/', (0, checkPermissions_1.checkPermission)("Department", "create"), departmentController_1.createDepartment);
router.get('/', (0, checkPermissions_1.checkPermission)("Department", "view"), departmentController_1.getAllDepartments);
router.get('/:id', (0, checkPermissions_1.checkPermission)("Department", "view"), departmentController_1.getDepartmentById);
router.put('/:id', (0, checkPermissions_1.checkPermission)("Department", "update"), departmentController_1.updateDepartment);
router.delete('/:id', (0, checkPermissions_1.checkPermission)("Department", "delete"), departmentController_1.deleteDepartment);
exports.default = router;
