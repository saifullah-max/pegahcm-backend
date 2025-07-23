import { Router } from "express";
import { checkIn, checkOut, checkTodayAttendance, createLeaveType, getAllLeaveRequestsForAdmin, getAllLeaveTypes, getEmployeeLeaves, leaveRequest } from "../controllers/attendanceController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/roleMiddleware";

const router = Router();

router.use(authenticateToken as any);
router.use(isAdmin as any);

router.get('/leave-requests', getAllLeaveRequestsForAdmin as any);

export default router;