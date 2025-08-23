"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const checkPermissions_1 = require("../middlewares/checkPermissions");
const fixAttendanceController_1 = require("../controllers/fixAttendanceController");
const canApproveAttendanceFixReq_1 = require("../middlewares/canApproveAttendanceFixReq");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
// create fix attendance req - user
router.post('/', (0, checkPermissions_1.checkPermission)("FixAttendance", "create"), fixAttendanceController_1.submitFixAttendanceRequest);
// get all reqs - admin or subRole having permission
router.get('/', (0, checkPermissions_1.checkPermission)("FixAttendance", "approve"), fixAttendanceController_1.getAllFixRequests);
// get reqs of specific employee - user can see
router.get('/:employeeId', (0, checkPermissions_1.checkPermission)("FixAttendance", "view"), fixAttendanceController_1.getFixRequestsByEmployee);
// update status of req - admin or subRole having permission
router.put('/:id', canApproveAttendanceFixReq_1.canApproveFixRequest, (0, checkPermissions_1.checkPermission)("FixAttendance", "approve"), fixAttendanceController_1.updateFixRequestStatus);
// update any field of data - admin or subRole having permission (in case users given working hour seems bogous or false -- something like that)
router.put('/edit/:id', canApproveAttendanceFixReq_1.canApproveFixRequest, (0, checkPermissions_1.checkPermission)("FixAttendance", "approve"), fixAttendanceController_1.editFixRequest);
// delete entry - admin - or subRole having permission
router.delete('/:id', (0, checkPermissions_1.checkPermission)("FixAttendance", "delete"), fixAttendanceController_1.deleteFixRequest);
// Get single record - admin or subRole having permission (form autoFills by this)
router.get('/single/:id', (0, checkPermissions_1.checkPermission)("FixAttendance", "approve"), fixAttendanceController_1.getFixRequestById);
exports.default = router;
