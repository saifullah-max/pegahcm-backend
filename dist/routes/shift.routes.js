"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shift_controller_1 = require("../controllers/shift.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authMiddleware_1.authenticateToken);
// Shift routes
router.post('/', (0, checkPermissions_1.checkPermission)("Shift", "create"), shift_controller_1.createShift);
router.get('/', (0, checkPermissions_1.checkPermission)("Shift", "view"), shift_controller_1.getAllShifts);
router.get('/:id', (0, checkPermissions_1.checkPermission)("Shift", "view"), shift_controller_1.getShiftById);
router.put('/:id', (0, checkPermissions_1.checkPermission)("Shift", "update"), shift_controller_1.updateShift);
router.delete('/:id', (0, checkPermissions_1.checkPermission)("Shift", "delete"), shift_controller_1.deleteShift);
exports.default = router;
