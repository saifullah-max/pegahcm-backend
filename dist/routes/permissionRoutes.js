"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const permissionController_1 = require("../controllers/permissionController");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
// checkPermission("Permission", "create"),
router.post("/", (0, checkPermissions_1.checkPermission)("Permission", "create"), permissionController_1.createPermission);
router.get('/', (0, checkPermissions_1.checkPermission)("Permission", "view"), permissionController_1.getAllPermissions);
router.get('/:subRoleId', (0, checkPermissions_1.checkPermission)("Permission", "view"), permissionController_1.getPermissionsOfSubRole);
router.put('/sub-role/:subRoleId', (0, checkPermissions_1.checkPermission)("Permission", "update"), permissionController_1.updateSubRolePermissions);
router.post('/user', (0, checkPermissions_1.checkPermission)("Permission", "create"), permissionController_1.assignPermissionsToUser);
router.get('/user/:userId', (0, checkPermissions_1.checkPermission)("Permission", "view"), permissionController_1.getPermissionsOfUser);
router.get('/id/user/:userId', (0, checkPermissions_1.checkPermission)("Permission", "view"), permissionController_1.getPermissionIdOfUser);
exports.default = router;
