import express from "express";
import {
  getComprehensiveDashboard,
  getRevenueChart,
  getRecentBids,
  getTeamPerformance
} from "../controllers/salesDashboardController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { checkPermission } from "../middlewares/checkPermissions";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// RECOMMENDED: Single comprehensive endpoint - Use this for main dashboard (reduces 7 API calls to 1)
router.get(
  "/comprehensive",
  checkPermission("salesDashboard", "view"),
  getComprehensiveDashboard
);

// Individual endpoints kept for specific use cases
router.get(
  "/revenue-chart",
  checkPermission("salesDashboard", "view"),
  getRevenueChart
);

router.get(
  "/recent-bids",
  checkPermission("salesDashboard", "view"),
  getRecentBids
);

router.get(
  "/team-performance",
  checkPermission("salesDashboard", "view"),
  getTeamPerformance
);

export default router;
