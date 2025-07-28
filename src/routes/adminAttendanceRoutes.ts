import { Router } from "express";
import { getAllLeaveRequestsForAdmin, updateLeaveStatus } from "../controllers/attendanceController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { isAdminOrHR } from "../middlewares/roleMiddleware";

const router = Router();

router.use(authenticateToken as any);
router.use(isAdminOrHR as any);

router.get('/leave-requests', getAllLeaveRequestsForAdmin as any);

router.patch('/leave-requests/:id', updateLeaveStatus as any);

export default router;