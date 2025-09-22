import { Router } from "express";
import { getAllLeaveRequestsForAdmin, getEmployeesAttendanceSummary, updateLeaveStatus } from "../controllers/attendanceController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { isAdminOrHR } from "../middlewares/roleMiddleware";
import { checkPermission } from "../middlewares/checkPermissions";

const router = Router();

router.use(authenticateToken as any);
// router.use(isAdminOrHR as any);

router.get('/leave-requests', checkPermission("Attendance", "view-all"), getAllLeaveRequestsForAdmin as any);

router.patch('/leave-requests/:id', checkPermission("Attendance", "approve"), updateLeaveStatus as any);

router.get('/employee-summary', checkPermission("Attendance", "approve"), getEmployeesAttendanceSummary as any)

export default router;