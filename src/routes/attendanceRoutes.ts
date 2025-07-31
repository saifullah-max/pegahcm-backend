import { Router } from "express";
import { checkIn, checkOut, checkTodayAttendance, createBreak, createLeaveType, endBreak, getAllAttendance, getAllAttendanceRecords, getAllLeaveTypes, getBreaksByAttendanceRecord, getEmployeeHoursSummary, getEmployeeLeaves, leaveRequest } from "../controllers/attendanceController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/roleMiddleware";
import { checkPermission } from "../middlewares/checkPermissions";

const router = Router();

router.use(authenticateToken as any);

router.get('/today',checkPermission("Attendance", "view"), checkTodayAttendance as any)

router.get('/employee/all', checkPermission("Attendance", "view"), getAllAttendanceRecords as any)

router.post('/check-in', checkPermission("Attendance", "create"), checkIn as any);

router.post('/check-out', checkPermission("Attendance", "create"), checkOut as any);

router.post('/leave', checkPermission("Attendance", "create"), leaveRequest as any)

router.get('/leave', checkPermission("Attendance", "view"), getEmployeeLeaves as any);

// router.use(isAdmin as any);
router.post('/leave-type', checkPermission("Attendance", "create"), createLeaveType as any);

router.get('/leave-type', checkPermission("Attendance", "view"), getAllLeaveTypes as any);

router.get('/all', checkPermission("Attendance", "view"), getAllAttendance as any);

router.get('/hours-lock', checkPermission("Attendance", "view"), getEmployeeHoursSummary as any)

router.post('/break/create', checkPermission("Attendance", "create"), createBreak as any);

router.post('/break/end', checkPermission("Attendance", "create"), endBreak as any);

router.get('/break/all/:attendanceRecordId', checkPermission("Attendance", "create"), getBreaksByAttendanceRecord as any);
export default router;