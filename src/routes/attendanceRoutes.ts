import { Router } from "express";
import { checkIn, checkOut, checkTodayAttendance, createBreak, createLeaveType, endBreak, getAllAttendance, getAllAttendanceRecords, getAllLeaveTypes, getBreaksByAttendanceRecord, getEmployeeHoursSummary, getEmployeeLeaves, leaveRequest } from "../controllers/attendanceController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/roleMiddleware";

const router = Router();

router.use(authenticateToken as any);

router.get('/today', checkTodayAttendance as any)

router.get('/employee/all', getAllAttendanceRecords as any)

router.post('/check-in', checkIn as any);

router.post('/check-out', checkOut as any);

router.post('/leave', leaveRequest as any)

router.get('/leave', getEmployeeLeaves as any);

// router.use(isAdmin as any);
router.post('/leave-type', createLeaveType as any);

router.get('/leave-type', getAllLeaveTypes as any);

router.get('/all', getAllAttendance as any);

router.get('/hours-lock', getEmployeeHoursSummary as any)

router.post('/break/create', createBreak as any);

router.post('/break/end', endBreak as any);

router.get('/break/all/:attendanceRecordId', getBreaksByAttendanceRecord as any);
export default router;