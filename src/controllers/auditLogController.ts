import { Request, Response } from "express";
import AuditLog from "../models/AuditLog";

// GET /api/audit-logs - Get audit logs with pagination and filters
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      actorId,
      actorName,
      method,
      route,
      module,
      action,
      startDate,
      endDate,
      statusCode
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20));
    const skip = Math.max(0, (pageNum - 1) * limitNum);

    // Build filter query
    const filter: any = {};

    if (actorId) filter.actorId = actorId;
    if (actorName) filter.actorName = { $regex: actorName, $options: 'i' };
    if (method) filter.method = method;
    if (route) filter.route = { $regex: route, $options: 'i' };
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (statusCode) filter.statusCode = parseInt(statusCode as string);

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }


    // Use aggregate for sorting large sets with allowDiskUse
    // Use native MongoDB driver for allowDiskUse
    const [logs, total] = await Promise.all([
      AuditLog.collection.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      ], { allowDiskUse: true }).toArray(),
      AuditLog.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || error
    });
  }
};

// GET /api/audit-logs/:id - Get single audit log by ID
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: log
    });
  } catch (error: any) {
    console.error("Error fetching audit log:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || error
    });
  }
};

// GET /api/audit-logs/stats - Get audit log statistics
export const getAuditLogStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const [
      totalLogs,
      byMethod,
      byStatusCode,
      byActor,
      recentActivity
    ] = await Promise.all([
      AuditLog.countDocuments(dateFilter),
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$method", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).allowDiskUse(true),
      AuditLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$statusCode", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).allowDiskUse(true),
      AuditLog.aggregate([
        { $match: { ...dateFilter, actorName: { $exists: true, $ne: null } } },
        { $group: { _id: { id: "$actorId", name: "$actorName" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { actorId: "$_id.id", actorName: "$_id.name", count: 1, _id: 0 } }
      ]).allowDiskUse(true),
      AuditLog.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('method route actorName statusCode createdAt')
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_logs: totalLogs,
        by_method: byMethod,
        by_status_code: byStatusCode,
        top_actors: byActor,
        recent_activity: recentActivity
      }
    });
  } catch (error: any) {
    console.error("Error fetching audit log stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || error
    });
  }
};

// GET /api/audit-logs/user/:userId - Get logs for specific user
export const getUserAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20));
    const skip = Math.max(0, (pageNum - 1) * limitNum);


    // Use aggregate for sorting large sets with allowDiskUse
    // Use native MongoDB driver for allowDiskUse
    const [logs, total] = await Promise.all([
      AuditLog.collection.aggregate([
        { $match: { actorId: userId } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      ], { allowDiskUse: true }).toArray(),
      AuditLog.countDocuments({ actorId: userId })
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error("Error fetching user audit logs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || error
    });
  }
};
