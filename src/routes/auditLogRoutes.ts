import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  getUserAuditLogs
} from "../controllers/auditLogController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all audit logs with filters and pagination
router.get("/", getAuditLogs);

// Get audit log statistics
router.get("/stats", getAuditLogStats);

// Get logs for a specific user
router.get("/user/:userId", getUserAuditLogs);

// Get single audit log by ID
router.get("/:id", getAuditLogById);

export default router;
