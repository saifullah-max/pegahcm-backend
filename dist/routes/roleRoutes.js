"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleController_1 = require("../controllers/roleController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const router = (0, express_1.Router)();
// Protected routes - require authentication
router.use(authMiddleware_1.authenticateToken);
router.post('/', (0, checkPermissions_1.checkPermission)("Role", "create"), roleController_1.createRole);
router.get('/', (0, checkPermissions_1.checkPermission)("Role", "view"), roleController_1.getRoles);
router.get('/:id', (0, checkPermissions_1.checkPermission)("Role", "view"), roleController_1.getRoleById);
router.put('/:id', (0, checkPermissions_1.checkPermission)("Role", "update"), roleController_1.updateRole);
router.delete('/:id', (0, checkPermissions_1.checkPermission)("Role", "delete"), roleController_1.deleteRole);
exports.default = router;
