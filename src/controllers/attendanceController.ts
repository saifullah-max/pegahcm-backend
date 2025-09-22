import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import {
  createScopedNotification,
  notifyLeaveApprovers,
} from "../utils/notificationUtils";
import prisma from "../utils/Prisma";
import moment from "moment-timezone";
interface CustomJwtPayload extends JwtPayload {
  id: string;
}

export const checkIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const userId = user.userId;

    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          include: { role: true, subRole: true },
        },
      },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const {
      id: employeeId,
      subDepartmentId,
      departmentId,
      user: userMeta,
    } = employee;
    const roleName = userMeta.role.name.toLowerCase();
    const roleTag = userMeta.roleTag;

    const todayUtc = moment().utc().startOf("day");
    const todayEndUtc = moment().utc().endOf("day");

    // ✅ Check if on approved leave
    const onLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: "Approved",
        startDate: { lte: todayUtc.toDate() },
        endDate: { gte: todayEndUtc.toDate() },
      },
    });

    if (onLeave) {
      res.status(403).json({ message: "Cannot check-in while on leave." });
      return;
    }

    // ✅ Check if already checked in
    const alreadyCheckedIn = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: todayUtc.toDate(), lte: todayEndUtc.toDate() },
      },
    });

    if (alreadyCheckedIn) {
      res.status(400).json({ message: "Already checked in today." });
      return;
    }

    // ✅ Get shift info
    const { shiftId } = req.body;
    if (!shiftId) {
      res.status(400).json({ message: "Shift ID is required." });
      return;
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) {
      res.status(404).json({ message: "Shift not found." });
      return;
    }

    // ✅ Get user's timezone (fallback to Asia/Karachi if not provided)
    const userTimezone = req.headers["x-timezone"]?.toString() || "Asia/Karachi";

    // ✅ Current time in user's timezone
    const now = moment().tz(userTimezone);

    // ✅ Extract shift start time (ignore old date, only take time part)
    const shiftStartHour = moment(shift.startTime).utc().hour();
    const shiftStartMinute = moment(shift.startTime).utc().minute();

    // ✅ Today's shift start in user's timezone
    const shiftStartLocal = now.clone().startOf("day").hour(shiftStartHour).minute(shiftStartMinute).second(0);

    // ✅ Late threshold = shift start + 30 mins
    const lateThresholdLocal = shiftStartLocal.clone().add(30, "minutes");

    console.log({
      nowLocal: now.format(),
      shiftStartLocal: shiftStartLocal.format(),
      lateThresholdLocal: lateThresholdLocal.format(),
    });

    // ✅ Determine status
    let status = "Present";
    let lateMessage = "";

    if (now.isAfter(lateThresholdLocal)) {
      status = "Late";

      const diffMinutes = now.diff(shiftStartLocal, "minutes");
      const lateHours = Math.floor(diffMinutes / 60);
      const lateMins = diffMinutes % 60;

      lateMessage = `You are ${lateHours > 0 ? lateHours + " hr " : ""}${lateMins} mins late`;
    } else if (now.isBefore(shiftStartLocal)) {
      status = "Early";
    }

    let lateMinutes: number | null = null;

    if (status === "Late") {
      lateMinutes = now.diff(shiftStartLocal, "minutes");
    }

    // ✅ Save attendance record
    const newRecord = await prisma.attendanceRecord.create({
      data: {
        employeeId,
        shiftId,
        date: now.utc().toDate(),
        clockIn: now.utc().toDate(),
        status,
        lateMinutes,
      },
      include: { shift: true },
    });

    const clockInTimeLocal = now.format("hh:mm A"); // local time

    // ✅ Send notifications
    const baseNotification = {
      title: "Clock In",
      message: `${userMeta.fullName} clocked in at ${clockInTimeLocal} (${status})`,
      type: "ClockIn" as const,
      employeeId,
    };

    const promises = [];

    if (roleName === "user" && subDepartmentId) {
      promises.push(
        createScopedNotification({
          scope: "TEAMLEADS_SUBDEPT",
          data: baseNotification,
          targetIds: { subDepartmentId },
          visibilityLevel: 3,
          excludeUserId: userId,
        })
      );
    } else if (roleName === "teamlead" && departmentId) {
      promises.push(
        createScopedNotification({
          scope: "MANAGERS_DEPT",
          data: baseNotification,
          targetIds: { departmentId },
          visibilityLevel: 2,
          excludeUserId: userId,
        })
      );
    } else if (roleName === "manager" && roleTag === "HR") {
      promises.push(
        createScopedNotification({
          scope: "DIRECTORS_HR",
          data: baseNotification,
          visibilityLevel: 1,
          excludeUserId: userId,
        })
      );
    } else if (roleName === "director") {
      promises.push(
        createScopedNotification({
          scope: "ADMIN_ONLY",
          data: baseNotification,
          visibilityLevel: 0,
          excludeUserId: userId,
        })
      );
    }

    await Promise.all(promises);

    res.status(200).json({
      message: `Check-in successful (${status})`,
      status,
      lateMessage: lateMessage || null,
      clockIn: now.utc().toISOString(),
      fullData: newRecord,
    });
  } catch (err) {
    console.error("Check-in error:", err);
    next(err);
  }
};

// POST /api/attendance/check-out
export const checkOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const userId = user.userId;

    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          include: { role: true, subRole: true },
        },
      },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const {
      id: employeeId,
      subDepartmentId,
      departmentId,
      user: userMeta,
    } = employee;
    const roleName = userMeta.role.name.toLowerCase();
    const roleTag = userMeta.roleTag;

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (!attendance || !attendance.clockIn) {
      res.status(400).json({ message: "No check-in record found." });
      return;
    }

    if (attendance.clockOut) {
      res.status(400).json({ message: "Already checked out today." });
      return;
    }

    const now = new Date();
    const breaks = await prisma.break.findMany({
      where: { attendanceRecordId: attendance.id },
    });

    let totalBreakMs = 0;
    for (const brk of breaks) {
      if (brk.breakStart && brk.breakEnd) {
        totalBreakMs +=
          new Date(brk.breakEnd).getTime() - new Date(brk.breakStart).getTime();
      }
    }

    const netWorkingMinutes = Math.floor(
      (now.getTime() - new Date(attendance.clockIn).getTime() - totalBreakMs) /
      (1000 * 60)
    );

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: attendance.id },
      data: { clockOut: now, netWorkingMinutes },
    });

    const clockOutTime = now.toLocaleTimeString();
    const baseNotification = {
      title: "Clock Out",
      message: `${userMeta.fullName} clocked out at ${clockOutTime}`,
      type: "ClockOut" as const,
      employeeId,
    };

    const promises = [];

    if (roleName === "user" && subDepartmentId) {
      promises.push(
        createScopedNotification({
          scope: "TEAMLEADS_SUBDEPT",
          data: baseNotification,
          targetIds: { subDepartmentId },
          visibilityLevel: 3,
          excludeUserId: userId,
        })
      );
    } else if (roleName === "teamlead" && departmentId) {
      promises.push(
        createScopedNotification({
          scope: "MANAGERS_DEPT",
          data: baseNotification,
          targetIds: { departmentId },
          visibilityLevel: 2,
          excludeUserId: userId,
        })
      );
    } else if (roleName === "manager" && roleTag === "HR") {
      promises.push(
        createScopedNotification({
          scope: "DIRECTORS_HR",
          data: baseNotification,
          visibilityLevel: 1,
          excludeUserId: userId,
        })
      );
    } else if (roleName === "director") {
      promises.push(
        createScopedNotification({
          scope: "ADMIN_ONLY",
          data: baseNotification,
          visibilityLevel: 0,
          excludeUserId: userId,
        })
      );
    }

    await Promise.all(promises);

    res
      .status(200)
      .json({ message: "Check-out successful", attendance: updatedRecord });
  } catch (err) {
    console.error("Check-out error:", err);
    next(err);
  }
};

// GET /api/attendance/today
export const checkTodayAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: userId not found in token." });
    }

    // Step 1: Get employeeId using userId
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Step 2: Get today's date range (00:00 to 23:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Step 3: Check if attendance exists today
    const attendance = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        breaks: {
          orderBy: { breakStart: "asc" },
          include: { breakType: true },
        },
      },
    });

    if (!attendance) {
      return res.status(200).json({ checkedIn: false, checkedOut: false });
    }

    let activeBreak = null;

    if (attendance) {
      const ongoing = attendance.breaks.find((b: any) => b.breakEnd === null);
      if (ongoing) {
        activeBreak = {
          id: ongoing.id,
          breakStart: ongoing.breakStart,
          breakType: ongoing.breakType, // includes name
        };
      }
    }

    return res.status(200).json({
      checkedIn: true,
      checkedOut: attendance.clockOut !== null,
      attendance,
      activeBreak, // ✅ Now included in response
    });
  } catch (error) {
    console.error("Error checking today’s attendance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/attendance/employee/all
export const getAllAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: userId not found in token." });
    }

    // Step 1: Get employeeId using userId
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Step 2: Get all attendance records for this employee
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        clockIn: "desc", // Optional: latest first
      },
    });

    return res.status(200).json({
      employeeId: employee.id,
      totalRecords: attendanceRecords.length,
      records: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Leave request controller
export const leaveRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const userId = user.userId;

    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for this user.",
      });
    }

    const { leaveId, startDate, endDate, reason, approvedById } = req.body;

    if (!leaveId || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const data: any = {
      employeeId: employee.id,
      leaveTypeId: leaveId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: "Pending",
    };

    if (approvedById) {
      data.approvedById = approvedById;
    }

    const newRequest = await prisma.leaveRequest.create({ data });

    const leaveName = await prisma.leaveType.findUnique({
      where: { id: leaveId },
    });
    const empName = await prisma.user.findUnique({
      where: { id: employee.userId },
    });

    await notifyLeaveApprovers({
      employeeId: employee.id,
      title: "New Leave Request",
      message: `${empName?.fullName} submitted a leave request from ${startDate} to ${endDate} for the ${leaveName?.name}`,
    });

    return res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// get all leave requests for an employee
export const getEmployeeLeaves = async (req: Request, res: Response) => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const userId = user.userId;

    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      include: {
        leaveType: true,
      },
      orderBy: { requestedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching employee leave requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const createLeaveType = async (req: Request, res: Response) => {
  const { name, description, isPaid, totalDays } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });
  }

  try {
    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        description,
        isPaid: isPaid ?? true, // default true if not provided
        totalDays: Number(totalDays),
      },
    });

    return res.status(201).json({ success: true, data: leaveType });
  } catch (error: any) {
    console.error("Error creating leave type:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Leave type with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating leave type",
    });
  }
};

export const getAllLeaveTypes = async (req: Request, res: Response) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany();
    console.log("LEAVE API hit: ", leaveTypes);
    return res.status(200).json({ success: true, data: leaveTypes });
  } catch (error) {
    console.error("Error fetching leave types:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching leave types",
    });
  }
};

// GET /api/admin/leave-requests
export const getAllLeaveRequestsForAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const { limit = "5", lastCursorId } = req.query;

    const limitNumber = parseInt(limit as string);
    // const skip = (pageNumber - 1) * limitNumber;

    const total = await prisma.leaveRequest.count({})
    const cursor = lastCursorId ? { id: lastCursorId } : undefined
    console.log("Cursor passed to db:", cursor);

    const leaveRequests = await prisma.leaveRequest.findMany({
      skip: cursor ? 1 : 0,
      take: limitNumber,
      cursor: lastCursorId ? { id: lastCursorId as string } : undefined,
      include: {
        leaveType: true,
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return res.status(200).json({
      success: true, data: {
        leaveRequests,
        pagination: {
          limit,
          total,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching leave requests for admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching leave requests",
    });
  }
};

// approve - reject leave request
export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }

    const currentUserId = (req.user as unknown as CustomJwtPayload).userId;

    // Fetch current user
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        role: true,
        subRole: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const roleName = user.role?.name;

    if (!roleName) {
      return res
        .status(403)
        .json({ success: false, message: "User has no role assigned." });
    }

    // 🔄 Fetch leave request (used in all branches)
    const targetLeaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              include: {
                subRole: true,
              },
            },
            department: true,
            subDepartment: true,
          },
        },
      },
    });

    if (!targetLeaveRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found." });
    }

    // 🔐 Sub-role level checks for non-admins
    if (roleName !== "admin") {
      if (!user.subRole || typeof user.subRole.level !== "number") {
        return res.status(403).json({
          success: false,
          message:
            "Approver sub-role level not found. Ensure approver has valid subRole assigned.",
        });
      }

      const approverLevel = user.subRole.level;
      const requesterLevel = targetLeaveRequest.employee?.user?.subRole?.level;

      if (requesterLevel === undefined || requesterLevel === null) {
        return res.status(403).json({
          success: false,
          message: "Requester sub-role level not found.",
        });
      }

      if (approverLevel >= requesterLevel) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot approve/reject requests of equal or higher-level employees.",
        });
      }
    }

    // ✅ Update leave status
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedAt: status === "Approved" ? new Date() : null,
        approvedById: currentUserId,
      },
    });

    if (status === "Approved") {
      const employeeId = targetLeaveRequest.employeeId;
      const startDate = new Date(targetLeaveRequest.startDate);
      const endDate = new Date(targetLeaveRequest.endDate);

      // Loop through each day in the leave range
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const formattedDate = new Date(currentDate);

        // Check if attendance record exists for this date
        const existingRecord = await prisma.attendanceRecord.findFirst({
          where: {
            employeeId: employeeId,
            date: {
              gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
              lt: new Date(formattedDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (existingRecord) {
          // ✅ Update existing record
          await prisma.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: { status: "OnLeave", absenceReason: "Leave Approved" },
          });
        } else {
          // ✅ Fetch shift for employee
          const shift = await prisma.shift.findFirst({
            where: { id: targetLeaveRequest.employee.shiftId! },
          });

          if (!shift) {
            throw new Error("Shift not found for employee.");
          }

          // ✅ Create new record with mandatory fields
          await prisma.attendanceRecord.create({
            data: {
              employeeId: employeeId,
              date: new Date(formattedDate),
              status: "OnLeave",
              shiftId: shift.id,
              clockIn: shift.startTime, // Assuming shift.startTime is Date
              absenceReason: "Leave Approved",
            },
          });
        }


        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }


    const employeeUser = targetLeaveRequest.employee.user;
    const fullName = `${employeeUser.fullName}`;
    const fromDate = targetLeaveRequest.startDate.toLocaleDateString();
    const toDate = targetLeaveRequest.endDate.toLocaleDateString();

    // 🔔 1. Notify the employee who applied
    await createScopedNotification({
      scope: "EMPLOYEE_ONLY",
      data: {
        title:
          status === "Approved" ? "🎉 Leave Approved" : "⛔ Leave Rejected",
        message:
          status === "Approved"
            ? `${user.fullName} approved your leave from ${fromDate} to ${toDate}.`
            : `Your leave request from ${fromDate} to ${toDate} was rejected.`,
        type: "LeaveRequest",
      },
      targetIds: {
        userId: employeeUser.id,
      },
      visibilityLevel: 0,
      showPopup: true,
    });

    // 🔔 2. Notify department managers
    if (targetLeaveRequest.employee.departmentId) {
      await createScopedNotification({
        scope: "MANAGERS_DEPT",
        data: {
          title: "Leave Request Processed",
          message: `${user.fullName
            } ${status.toLowerCase()} the leave request of ${fullName}.`,
          type: "LeaveRequest",
        },
        targetIds: {
          departmentId: targetLeaveRequest.employee.departmentId,
        },
        visibilityLevel: 1,
        excludeUserId: currentUserId,
        showPopup: true,
      });
    }

    // 🔔 3. Notify team leads of the same sub-department
    if (targetLeaveRequest.employee.subDepartmentId) {
      await createScopedNotification({
        scope: "TEAMLEADS_SUBDEPT",
        data: {
          title: "Leave Request Processed",
          message: `${user.fullName
            } ${status.toLowerCase()} the leave request of ${fullName}.`,
          type: "LeaveRequest",
        },
        targetIds: {
          subDepartmentId: targetLeaveRequest.employee.subDepartmentId,
        },
        visibilityLevel: 1,
        excludeUserId: currentUserId,
        showPopup: true,
      });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating leave request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating leave request",
    });
  }
};

// all attendance
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const allAttendance = await prisma.attendanceRecord.findMany({
      include: {
        employee: true,
        shift: true,
        breaks: true,
      },
    });
    res.status(200).json(allAttendance);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

// GET weekly hours summary (Mon-Fri) for an employee
export const getEmployeeDailyHoursSummary = async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId as string;
    const weekNumber = req.query.weekNumber ? parseInt(req.query.weekNumber as string) : undefined;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Helper: get Monday of a week number
    const getMondayOfWeek = (weekNum: number): Date => {
      const firstDayOfMonth = new Date(year, month, 1);
      const firstMondayOffset = (8 - firstDayOfMonth.getDay()) % 7; // 0=Sun, 1=Mon
      const monday = new Date(firstDayOfMonth);
      monday.setDate(firstDayOfMonth.getDate() + firstMondayOffset + (weekNum - 1) * 7);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    // Determine the week to fetch
    let startOfWeek: Date;
    let endOfWeek: Date;
    if (weekNumber) {
      startOfWeek = getMondayOfWeek(weekNumber);
    } else {
      // Current week: Monday
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek = new Date(year, month, diff);
      startOfWeek.setHours(0, 0, 0, 0);
    }
    // Friday
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch attendance records for the week (Mon-Fri)
    const attendanceData = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: startOfWeek, lte: endOfWeek },
        clockOut: { not: null },
      },
      orderBy: { date: "asc" },
    });

    const result = {
      weeklyWorkedHours: 0,
      weeklyLateMinutes: 0,
      daily: {} as Record<string, {
        clockIn: Date | null;
        clockOut: Date | null;
        hoursWorked: number;
        lateMinutes: number;
        status: string;
      }>
    };

    for (const record of attendanceData) {
      const { date, clockIn, clockOut, lateMinutes, status } = record;
      if (!clockOut || !clockIn) continue;

      const workedHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const dateKey = new Date(date).toISOString().split("T")[0];

      result.daily[dateKey] = {
        clockIn,
        clockOut,
        hoursWorked: workedHours,
        lateMinutes: lateMinutes || 0,
        status: status || "Pending",
      };

      result.weeklyWorkedHours += workedHours;
      result.weeklyLateMinutes += lateMinutes || 0;
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Error fetching weekly hours:", error);
    res.status(500).json({ message: "Failed to fetch weekly hours" });
  }
};

// GET total hours clocked per employee this week & month
export const getEmployeeHoursSummary = async (req: Request, res: Response) => {
  try {
    const attendanceData = await prisma.attendanceRecord.findMany({
      include: { employee: true },
    });

    const result: Record<string, { weekly: number; monthly: number }> = {};

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
    startOfWeek.setDate(diff);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfMonth.setHours(0, 0, 0, 0);

    for (const record of attendanceData) {
      const { employeeId, clockIn, clockOut, date } = record;
      if (!clockOut) continue; // incomplete record

      const hoursWorked =
        (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

      if (!result[employeeId]) {
        result[employeeId] = { weekly: 0, monthly: 0 };
      }

      const recordDate = new Date(date);
      if (recordDate >= startOfWeek) result[employeeId].weekly += hoursWorked;
      if (recordDate >= startOfMonth) result[employeeId].monthly += hoursWorked;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error calculating employee hours:", error);
    res.status(500).json({ message: "Failed to calculate employee hours" });
  }
};

// POST add break
export const createBreak = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const { breakType } = req.body;

    // 1. Find Employee
    const employee = await prisma.employee.findUnique({
      where: { userId: user.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // 2. Get today's AttendanceRecord
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!todayAttendance) {
      return res
        .status(404)
        .json({ message: "No attendance record found for today." });
    }

    // 3. Check for existing active break
    const existingBreak = await prisma.break.findFirst({
      where: {
        attendanceRecordId: todayAttendance.id,
        breakEnd: null,
      },
    });

    if (existingBreak) {
      return res.status(400).json({ message: "You are already on a break." });
    }

    // ✅ 4. Find BreakType by name
    const breakTypeRecord = await prisma.breakType.findUnique({
      where: { name: breakType },
    });

    if (!breakTypeRecord) {
      const existingTypes = await prisma.breakType.findMany({
        select: { name: true },
      });
      return res.status(400).json({
        message: `Invalid break type. Available types: ${existingTypes
          .map((b: any) => b.name)
          .join(", ")}`,
      });
    }

    // ✅ 5. Create new break using breakTypeId
    const newBreak = await prisma.break.create({
      data: {
        breakStart: new Date(),
        breakTypeId: breakTypeRecord.id,
        attendanceRecordId: todayAttendance.id,
      },
    });

    return res.status(200).json({ message: "Break started.", break: newBreak });
  } catch (error) {
    console.error("Error creating break:", error);
    next(error);
  }
};

// POST end break
export const endBreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as unknown as CustomJwtPayload;

    // 1. Get employee by userId
    const employee = await prisma.employee.findUnique({
      where: { userId: user.userId },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    // 2. Get today's AttendanceRecord
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendance = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (!attendance) {
      res
        .status(400)
        .json({ message: "No attendance record found for today." });
      return;
    }

    // 3. Find active break (no breakEnd yet)
    const activeBreak = await prisma.break.findFirst({
      where: {
        attendanceRecordId: attendance.id,
        breakEnd: null,
      },
    });

    if (!activeBreak) {
      res.status(400).json({ message: "No active break found to end." });
      return;
    }

    // 4. End the break
    const endedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        breakEnd: new Date(),
      },
    });

    res
      .status(200)
      .json({ message: "Break ended successfully.", break: endedBreak });
  } catch (err) {
    console.error("Error ending break:", err);
    next(err);
  }
};

// GET - all breaks by attendance Recordac
export const getBreaksByAttendanceRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attendanceRecordId } = req.query;

    if (!attendanceRecordId || typeof attendanceRecordId !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid attendanceRecordId." });
    }

    const breaks = await prisma.break.findMany({
      where: { attendanceRecordId },
      orderBy: { breakStart: "asc" },
    });

    res.status(200).json({ breaks });
  } catch (error) {
    console.error("Error fetching breaks:", error);
    next(error);
  }
};

// Employee summary
export const getEmployeesAttendanceSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const { limit = "5", lastCursorId } = req.query;

    const limitNumber = parseInt(limit as string);

    const total = await prisma.employee.count({})

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const employees = await prisma.employee.findMany({
      skip: lastCursorId ? 1 : 0,
      take: limitNumber,
      cursor: lastCursorId ? { id: lastCursorId as string } : undefined,
      include: {
        user: { select: { fullName: true, email: true } },
        department: true,
      },
      orderBy: { id: "desc" }
    });

    const summary = await Promise.all(
      employees.map(async (emp: any) => {
        const todayAttendance = await prisma.attendanceRecord.findFirst({
          where: {
            employeeId: emp.id,
            date: { gte: todayStart, lte: todayEnd },
          },
        });

        const onLeaveToday = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: emp.id,
            status: "Approved",
            startDate: { lte: todayStart },
            endDate: { gte: todayEnd },
          },
        });

        let todayStatus = "Absent";
        if (onLeaveToday) todayStatus = "OnLeave"
        else if (todayAttendance?.status === "Late") todayStatus = "Late";
        else if (todayAttendance?.status === "Present") todayStatus = "Present";

        const totalLeaves = await prisma.leaveRequest.count({
          where: {
            employeeId: emp.id,
            status: "Approved",
          },
        });

        const lateArrivals = await prisma.attendanceRecord.count({
          where: {
            employeeId: emp.id,
            status: "Late",
          },
        });
        return {
          employeeId: emp.id,
          fullName: emp.user.fullName,
          email: emp.user.email,
          department: emp.department?.name || "N/A",
          todayStatus,
          totalLeaves,
          lateArrivals
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: summary,
      pagination: {
        limit,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error("Failed to fetch employee summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};