import { Router } from "express";
import { checkIn, checkOut, checkTodayAttendance, createLeaveType, getAllAttendance, getAllAttendanceRecords, getAllLeaveTypes, getEmployeeHoursSummary, getEmployeeLeaves, leaveRequest } from "../controllers/attendanceController";
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
export default router;