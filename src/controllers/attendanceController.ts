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

// export const checkIn = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const user = req.user as unknown as CustomJwtPayload;
//     const user_id = user.userId;

//     // Fetch employee info
//     const employee = await prisma.employees.findUnique({
//       where: { user_id },
//       include: { user: { include: { role: true, sub_role: true } } },
//     });

//     if (!employee) {
//       res.status(404).json({ message: "Employee not found." });
//       return;
//     }

//     const {
//       id: employee_id,
//       sub_department_id,
//       department_id,
//       user: userMeta,
//     } = employee;

//     const roleName = userMeta.role.name.toLowerCase();
//     const role_tag = (userMeta as any).role_tag;

//     // Timezone
//     const userTimezone = req.headers["x-timezone"]?.toString() || "Asia/Karachi";
//     const now = moment().tz(userTimezone);

//     /**
//      * ---------------------------------------------------------
//      * FIX #1 — Correct same-day attendance matching
//      * Attendance must be for TODAY in user timezone
//      * ---------------------------------------------------------
//      */
//     const dayStart = now.clone().startOf("day");
//     const dayEnd = now.clone().endOf("day");

//     const alreadyCheckedIn = await prisma.attendance_records.findFirst({
//       where: {
//         employee_id,
//         // Convert dayStart/dayEnd to UTC for DB filtering
//         date: {
//           gte: dayStart.utc().toDate(),
//           lte: dayEnd.utc().toDate(),
//         },
//       },
//     });

//     if (alreadyCheckedIn) {
//       res.status(400).json({ message: "Already checked in today." });
//       return;
//     }

//     // Shift info
//     const { shift_id } = req.body;
//     if (!shift_id) {
//       res.status(400).json({ message: "Shift ID is required." });
//       return;
//     }

//     const shift = await prisma.shifts.findUnique({ where: { id: shift_id } });
//     if (!shift) {
//       res.status(404).json({ message: "Shift not found." });
//       return;
//     }

//     /**
//      * ---------------------------------------------------------
//      * FIX #2 — Correct "today shiftStart/shiftEnd" construction
//      * moment("08:00") is INVALID. We combine today's date + time
//      * ---------------------------------------------------------
//      */
//     const shiftStart = moment.tz(now.format('YYYY-MM-DD') + ' ' + moment(shift.start_time).format('HH:mm:ss'), userTimezone);
//     let shiftEnd = moment.tz(now.format('YYYY-MM-DD') + ' ' + moment(shift.end_time).format('HH:mm:ss'), userTimezone);

//     if (shiftEnd.isBefore(shiftStart)) shiftEnd.add(1, 'day'); // handle overnight


//     /**
//      * ---------------------------------------------------------
//      * FIX #3 — Late calculation uses same-day shiftStart
//      * ---------------------------------------------------------
//      */
//     const lateThreshold = shiftStart.clone().add(30, "minutes");

//     let status = "Present";
//     let lateMessage = "";
//     let late_minutes: number | null = null;

//     if (now.isAfter(lateThreshold)) {
//       status = "Late";

//       const diffMinutes = now.diff(shiftStart, "minutes");
//       const lateHours = Math.floor(diffMinutes / 60);
//       const lateMins = diffMinutes % 60;

//       lateMessage = `You are ${lateHours > 0 ? lateHours + " hr " : ""}${lateMins} mins late`;
//       late_minutes = diffMinutes;

//       // Check for approved late fix request
//       const approvedFix = await prisma.attendance_fix_requests.findFirst({
//         where: {
//           employee_id,
//           status: "Approved",
//           request_type: { in: ["check_in", "Both", "both"] } as any,
//           requested_check_in: {
//             $gte: dayStart,
//             $lte: dayEnd,
//           },
//         },
//       });

//       if (approvedFix?.requested_check_in) {
//         const approvedTime = moment(approvedFix.requested_check_in).tz(userTimezone);

//         // If the actual check-in (now) is same-or-before the approved expected time,
//         // treat this attendance as approved_late and compute late_minutes based on approvedTime.
//         if (now.isSameOrBefore(approvedTime, "minute")) {
//           status = "approved_late";
//           late_minutes = Math.max(0, approvedTime.diff(shiftStart, "minutes"));
//           lateMessage = `Approved late (expected ${approvedTime.format("hh:mm A")})`;
//         } else {
//           // checked in after approved expected time -> remain Late (late_minutes already set)
//         }
//       }
//     } else if (now.isBefore(shiftStart)) {
//       status = "Early";
//     }

//     // Create attendance record
//     const newRecord = await prisma.attendance_records.create({
//       data: {
//         employee_id,
//         shift_id,
//         date: now.utc().toDate(),
//         clock_in: now.utc().toDate(),
//         clock_out: null, // explicitly set to null
//         status,
//         late_minutes,
//       },
//       include: { shift: true },
//     });

//     const clockInTimeLocal = now.format("hh:mm A");

//     // Notifications (same logic)
//     const baseNotification = {
//       title: "Clock In",
//       message: `${userMeta.full_name} clocked in at ${clockInTimeLocal} (${status})`,
//       type: "ClockIn" as const,
//       employee_id,
//     };

//     const promises: Promise<any>[] = [];
//     if (roleName === "user" && sub_department_id) {
//       promises.push(
//         createScopedNotification({
//           scope: "TEAMLEADS_SUBDEPT",
//           data: baseNotification,
//           target_ids: { sub_department_id },
//           visibilityLevel: 3,
//           excludeUserId: user_id,
//         })
//       );
//     } else if (roleName === "teamlead" && department_id) {
//       promises.push(
//         createScopedNotification({
//           scope: "MANAGERS_DEPT",
//           data: baseNotification,
//           target_ids: { department_id },
//           visibilityLevel: 2,
//           excludeUserId: user_id,
//         })
//       );
//     } else if (roleName === "manager" && role_tag === "HR") {
//       promises.push(
//         createScopedNotification({
//           scope: "DIRECTORS_HR",
//           data: baseNotification,
//           visibilityLevel: 1,
//           excludeUserId: user_id,
//         })
//       );
//     } else if (roleName === "director") {
//       promises.push(
//         createScopedNotification({
//           scope: "ADMIN_ONLY",
//           data: baseNotification,
//           visibilityLevel: 0,
//           excludeUserId: user_id,
//         })
//       );
//     }

//     await Promise.all(promises);

//     res.status(200).json({
//       message: `Check-in successful (${status})`,
//       status,
//       lateMessage: lateMessage || null,
//       clockIn: now.utc().toISOString(),
//       fullData: newRecord,
//     });

//   } catch (err) {
//     console.error("Check-in error:", err);
//     next(err);
//   }
// };

export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const user_id = user.userId;

    // Accept location and IP from request body (optional)
    const { check_in_ip, check_in_longitude, check_in_latitude } = req.body;

    const employee = await prisma.employees.findUnique({
      where: { user_id },
      include: { user: { include: { role: true } } },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const { id: employee_id, sub_department_id, department_id, user: userMeta } = employee;
    const roleName = userMeta.role.name.toLowerCase();
    const role_tag = (userMeta as any).role_tag;

    // Timezone
    const userTimezone = req.headers["x-timezone"]?.toString() || "Asia/Karachi";
    const now = moment().tz(userTimezone);

    // Check if user has an attendance record for today
    const dayStart = now.clone().startOf("day");
    const dayEnd = now.clone().endOf("day");

    const todayAttendance = await prisma.attendance_records.findFirst({
      where: {
        employee_id,
        date: {
          gte: dayStart.utc().toDate(),
          lte: dayEnd.utc().toDate(),
        },
      },
      orderBy: { clock_in: 'asc' },
    });

    // If already checked in (no checkout), prevent duplicate check-in
    if (todayAttendance && todayAttendance.clock_out === null) {
      res.status(400).json({
        message: "You have an active check-in. Please check out before checking in again."
      });
      return;
    }

    // Shift info
    const { shift_id } = req.body;
    if (!shift_id) {
      res.status(400).json({ message: "Shift ID is required." });
      return;
    }

    const shift = await prisma.shifts.findUnique({ where: { id: shift_id } });
    if (!shift) {
      res.status(404).json({ message: "Shift not found." });
      return;
    }

    // Construct shift start/end times anchored to today
    const shiftStart = moment.tz(now.format('YYYY-MM-DD') + ' ' + moment(shift.start_time).format('HH:mm:ss'), userTimezone);
    let shiftEnd = moment.tz(now.format('YYYY-MM-DD') + ' ' + moment(shift.end_time).format('HH:mm:ss'), userTimezone);

    if (shiftEnd.isBefore(shiftStart)) shiftEnd.add(1, 'day'); // handle overnight

    // If re-checking in (after previous checkout), validate against last shift's end time
    if (todayAttendance && todayAttendance.clock_out !== null) {
      // Get all shifts and find the one with the latest end time
      const allShifts = await prisma.shifts.findMany();

      let latestShiftEndTime = moment.tz(now.format('YYYY-MM-DD') + ' 00:00:00', userTimezone);

      allShifts.forEach(s => {
        const sEnd = moment.tz(now.format('YYYY-MM-DD') + ' ' + moment(s.end_time).format('HH:mm:ss'), userTimezone);
        if (sEnd.isAfter(latestShiftEndTime)) {
          latestShiftEndTime = sEnd;
        }
      });

      // Block check-in after the last shift's end time
      if (now.isAfter(latestShiftEndTime)) {
        res.status(400).json({
          message: `Cannot check in after last shift end time (${latestShiftEndTime.format('hh:mm A')}). All shifts have ended.`
        });
        return;
      }
    }

    // Determine status based on check-in time
    const lateThreshold = shiftStart.clone().add(30, "minutes");

    let status = "OnTime";
    let lateMessage = "";
    let late_minutes: number | null = null;

    if (now.isAfter(lateThreshold)) {
      status = "Late";
      const diffMinutes = now.diff(shiftStart, "minutes");
      const lateHours = Math.floor(diffMinutes / 60);
      const lateMins = diffMinutes % 60;
      lateMessage = `You are ${lateHours > 0 ? lateHours + " hr " : ""}${lateMins} mins late`;
      late_minutes = diffMinutes;

      // Check for approved late fix request
      const approvedFix = await prisma.attendance_fix_requests.findFirst({
        where: {
          employee_id,
          status: "Approved",
          request_type: { in: ["check_in", "Both", "both"] } as any,
          requested_check_in: {
            gte: dayStart.toDate(),
            lte: dayEnd.toDate(),
          },
        },
      });

      if (approvedFix?.requested_check_in) {
        const approvedTime = moment(approvedFix.requested_check_in).tz(userTimezone);
        if (now.isSameOrBefore(approvedTime, "minute")) {
          status = "approved_late";
          late_minutes = Math.max(0, approvedTime.diff(shiftStart, "minutes"));
          lateMessage = `Approved late (expected ${approvedTime.format("hh:mm A")})`;
        }
      }
    }

    // Create or update attendance record
    let attendanceRecord;
    if (todayAttendance) {
      // Re-opening after checkout - keep first check-in time, clear checkout
      attendanceRecord = await prisma.attendance_records.update({
        where: { id: todayAttendance.id },
        data: {
          clock_out: null, // Clear checkout to reopen
          // Keep the original clock_in time (first check-in of the day)
          // Don't update status or late_minutes as they're based on first check-in
        },
        include: { shift: true },
      });
    } else {
      // First check-in of the day
      attendanceRecord = await prisma.attendance_records.create({
        data: {
          employee_id,
          shift_id,
          date: now.utc().toDate(),
          clock_in: now.utc().toDate(),
          clock_out: null,
          status,
          late_minutes,
          check_in_ip: check_in_ip || req.ip || null,
          check_in_longitude: check_in_longitude ?? null,
          check_in_latitude: check_in_latitude ?? null,
        },
        include: { shift: true },
      });
    }

    const clockInTimeLocal = now.format("hh:mm A");

    // Notifications
    const baseNotification = {
      title: "Clock In",
      message: `${userMeta.full_name} clocked in at ${clockInTimeLocal} (${status})`,
      type: "ClockIn" as const,
      employee_id,
    };

    const promises: Promise<any>[] = [];
    if (roleName === "user" && sub_department_id) {
      promises.push(createScopedNotification({ scope: "TEAMLEADS_SUBDEPT", data: baseNotification, target_ids: { sub_department_id }, visibilityLevel: 3, excludeUserId: user_id }));
    } else if (roleName === "teamlead" && department_id) {
      promises.push(createScopedNotification({ scope: "MANAGERS_DEPT", data: baseNotification, target_ids: { department_id }, visibilityLevel: 2, excludeUserId: user_id }));
    } else if (roleName === "manager" && role_tag === "HR") {
      promises.push(createScopedNotification({ scope: "DIRECTORS_HR", data: baseNotification, visibilityLevel: 1, excludeUserId: user_id }));
    } else if (roleName === "director") {
      promises.push(createScopedNotification({ scope: "ADMIN_ONLY", data: baseNotification, visibilityLevel: 0, excludeUserId: user_id }));
    }

    await Promise.all(promises);

    const isReCheckIn = todayAttendance !== null;
    res.status(200).json({
      message: isReCheckIn ? `Re-check-in successful` : `Check-in successful (${status})`,
      status: todayAttendance?.status || status,
      lateMessage: isReCheckIn ? null : (lateMessage || null),
      clockIn: moment(attendanceRecord.clock_in).tz(userTimezone).format('hh:mm A'),
      isReCheckIn,
      fullData: attendanceRecord,
    });

  } catch (err) {
    console.error("Check-in error:", err);
    next(err);
  }
};

// GET /api/attendance/today

export const checkOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as unknown as CustomJwtPayload;
    const user_id = user.userId;

    const { check_out_ip, check_out_longitude, check_out_latitude } = req.body;


    // Fetch employee info
    const employee = await prisma.employees.findUnique({
      where: { user_id },
      include: { user: { include: { role: true } } },
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const { id: employee_id, sub_department_id, department_id, user: userMeta } = employee;
    const roleName = userMeta.role.name.toLowerCase();
    const role_tag = userMeta.role_tag;

    const userTimezone = req.headers["x-timezone"]?.toString() || "Asia/Karachi";
    const now = moment().tz(userTimezone);

    // Find latest active check-in
    const attendance = await prisma.attendance_records.findFirst({
      where: {
        employee_id,
        clock_out: null,
      },
      orderBy: { clock_in: "desc" },
    });

    if (!attendance) {
      res.status(400).json({ message: "No active check-in found. Please check in first." });
      return;
    }

    // Get day boundaries for reference
    const dayStart = now.clone().startOf("day");
    const dayEnd = now.clone().endOf("day");

    // First check-in is already stored in attendance.clock_in
    const firstCheckIn = attendance.clock_in;

    // Calculate break duration for current session
    const breaks = await prisma.breaks.findMany({ where: { attendance_record_id: attendance.id } });
    let totalBreakMs = 0;
    for (const brk of breaks) {
      if (brk.break_start && brk.break_end) {
        totalBreakMs += new Date(brk.break_end).getTime() - new Date(brk.break_start).getTime();
      }
    }

    // Calculate net working minutes for this session
    const sessionWorkingMinutes = Math.floor((now.toDate().getTime() - new Date(attendance.clock_in).getTime() - totalBreakMs) / (1000 * 60));

    // Calculate total working minutes from first check-in to current check-out (including gaps)
    const totalWorkingMinutes = Math.floor((now.toDate().getTime() - new Date(firstCheckIn).getTime()) / (1000 * 60));

    const updatedRecord = await prisma.attendance_records.update({
      where: { id: attendance.id },
      data: {
        clock_out: now.toDate(),
        net_working_minutes: sessionWorkingMinutes,
        check_out_ip: check_out_ip || req.ip || null,
        check_out_longitude: check_out_longitude ?? null,
        check_out_latitude: check_out_latitude ?? null,
      },
    });

    const clockOutTime = now.format("hh:mm A");
    const totalHours = Math.floor(totalWorkingMinutes / 60);
    const totalMins = totalWorkingMinutes % 60;

    const baseNotification = {
      title: "Clock Out",
      message: `${userMeta.full_name} clocked out at ${clockOutTime}. Total hours today: ${totalHours}h ${totalMins}m`,
      type: "ClockOut" as const,
      employee_id,
    };

    const promises = [];
    if (roleName === "user" && sub_department_id) {
      promises.push(createScopedNotification({ scope: "TEAMLEADS_SUBDEPT", data: baseNotification, target_ids: { sub_department_id }, visibilityLevel: 3, excludeUserId: user_id }));
    } else if (roleName === "teamlead" && department_id) {
      promises.push(createScopedNotification({ scope: "MANAGERS_DEPT", data: baseNotification, target_ids: { department_id }, visibilityLevel: 2, excludeUserId: user_id }));
    } else if (roleName === "manager" && role_tag === "HR") {
      promises.push(createScopedNotification({ scope: "DIRECTORS_HR", data: baseNotification, visibilityLevel: 1, excludeUserId: user_id }));
    } else if (roleName === "director") {
      promises.push(createScopedNotification({ scope: "ADMIN_ONLY", data: baseNotification, visibilityLevel: 0, excludeUserId: user_id }));
    }

    await Promise.all(promises);

    res.status(200).json({
      message: "Check-out successful",
      attendance: updatedRecord,
      sessionWorkingMinutes,
      totalWorkingMinutes,
      totalHoursToday: `${totalHours}h ${totalMins}m`,
      firstCheckIn: moment(firstCheckIn).tz(userTimezone).format('hh:mm A'),
      lastCheckOut: clockOutTime,
    });

  } catch (err) {
    console.error("Check-out error:", err);
    next(err);
  }
};

// GET /api/attendance/today

// export const checkOut = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const user = req.user as unknown as CustomJwtPayload;
//     const user_id = user.userId;

//     // Fetch employee info
//     const employee = await prisma.employees.findUnique({
//       where: { user_id },
//       include: { user: { include: { role: true, sub_role: true } } },
//     });

//     if (!employee) {
//       res.status(404).json({ message: "Employee not found." });
//       return;
//     }

//     const {
//       id: employee_id,
//       sub_department_id,
//       department_id,
//       user: userMeta
//     } = employee;

//     const roleName = userMeta.role.name.toLowerCase();
//     const role_tag = userMeta.role_tag;

//     // Get latest attendance (doesn’t matter if it's active or closed)
//     let attendance = await prisma.attendance_records.findFirst({
//       where: { employee_id },
//       orderBy: { clock_in: "desc" },
//     });

//     const now = new Date();

//     // ➤ If NO attendance exists → create a mock record
//     if (!attendance) {
//       attendance = await prisma.attendance_records.create({
//         data: {
//         employee_id,
//           shift_id: "00000000-0000-0000-0000-000000000000", // test mode
//           date: now,
//           clock_in: now,
//           status: "Present",
//           net_working_minutes: 0,
//       },
//     });
//     }

//     // ➤ Calculate break time (same as old code)
//     const breaks = await prisma.breaks.findMany({
//       where: { attendance_record_id: attendance.id },
//     });

//     let totalBreakMs = 0;
//     for (const brk of breaks) {
//       if (brk.break_start && brk.break_end) {
//         totalBreakMs +=
//           new Date(brk.break_end).getTime() -
//           new Date(brk.break_start).getTime();
//       }
//     }

//     const net_working_minutes = Math.floor(
//       (now.getTime() -
//         new Date(attendance.clock_in).getTime() -
//         totalBreakMs) /
//       (1000 * 60)
//     );

//     // ➤ Update checkout
//     const updatedRecord = await prisma.attendance_records.update({
//       where: { id: attendance.id },
//       data: {
//         clock_out: now,
//         net_working_minutes,
//       },
//     });

//     // ➤ Notification logic preserved (unchanged)
//     const clockOutTime = moment(now)
//       .tz("Asia/Karachi")
//       .format("hh:mm A");

//     const baseNotification = {
//       title: "Clock Out",
//       message: `${userMeta.full_name} clocked out at ${clockOutTime}`,
//       type: "ClockOut" as const,
//       employee_id,
//     };

//     const notifications = [];

//     if (roleName === "user" && sub_department_id) {
//       notifications.push(
//         createScopedNotification({
//           scope: "TEAMLEADS_SUBDEPT",
//           data: baseNotification,
//           target_ids: { sub_department_id },
//           visibilityLevel: 3,
//           excludeUserId: user_id,
//         })
//       );
//     } else if (roleName === "teamlead" && department_id) {
//       notifications.push(
//         createScopedNotification({
//           scope: "MANAGERS_DEPT",
//           data: baseNotification,
//           target_ids: { department_id },
//           visibilityLevel: 2,
//           excludeUserId: user_id,
//         })
//       );
//     } else if (roleName === "manager" && role_tag === "HR") {
//       notifications.push(
//         createScopedNotification({
//           scope: "DIRECTORS_HR",
//           data: baseNotification,
//           visibilityLevel: 1,
//           excludeUserId: user_id,
//         })
//       );
//     } else if (roleName === "director") {
//       notifications.push(
//         createScopedNotification({
//           scope: "ADMIN_ONLY",
//           data: baseNotification,
//           visibilityLevel: 0,
//           excludeUserId: user_id,
//         })
//       );
//     }

//     await Promise.all(notifications);

//     res.status(200).json({
//       message: "Check-out successful (TEST MODE)",
//       attendance: updatedRecord,
//     });

//   } catch (err) {
//     console.error("Check-out error:", err);
//     next(err);
//   }
// };

export const checkTodayAttendance = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.userId;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized: userId not found in token." });
    }

    // Get employeeId using userId
    const employee = await prisma.employees.findUnique({
      where: { user_id },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const userTimezone = req.headers["x-timezone"]?.toString() || "Asia/Karachi";
    const now = moment().tz(userTimezone);

    // Generate date boundaries (00:00 - 23:59)
    const startOfDay = now.clone().startOf('day').toDate();
    const endOfDay = now.clone().endOf('day').toDate();

    // Fetch attendance record for today (should be only one per day now)
    const attendance = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        clock_in: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        breaks: {
          orderBy: { break_start: "asc" },
          include: { break_type: true },
        },
      },
    });

    if (!attendance) {
      return res.status(200).json({
        checkedIn: false,
        checkedOut: false,
        attendance: null,
        attendanceStatus: null,
        breaks: [],
        activeBreak: null,
      });
    }

    // Check if currently checked in (attendance has no clock_out)
    const isCurrentlyCheckedIn = attendance.clock_out === null;

    // Calculate total working time from first check-in to now (or last check-out)
    const firstCheckIn = attendance.clock_in;
    const lastCheckOut = isCurrentlyCheckedIn ? now.toDate() : attendance.clock_out;

    let totalWorkingMinutes = 0;
    if (lastCheckOut) {
      totalWorkingMinutes = Math.floor(
        (new Date(lastCheckOut).getTime() - new Date(firstCheckIn).getTime()) /
        (1000 * 60)
      );
    }

    const totalHours = Math.floor(totalWorkingMinutes / 60);
    const totalMins = totalWorkingMinutes % 60;

    // Return checked-in status
    return res.status(200).json({
      checkedIn: isCurrentlyCheckedIn,
      checkedOut: !isCurrentlyCheckedIn,
      checkInTime: attendance.clock_in,
      checkOutTime: attendance.clock_out,
      attendanceStatus: attendance.status,
      attendance: attendance,
      firstCheckInToday: moment(firstCheckIn).tz(userTimezone).format('hh:mm A'),
      lastCheckOutToday: lastCheckOut ? moment(lastCheckOut).tz(userTimezone).format('hh:mm A') : null,
      totalWorkingTime: `${totalHours}h ${totalMins}m`,
    });
  } catch (error) {
    console.error("Error checking today's attendance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/attendance/employee/all - Current month working days only
export const getAllAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.userId;

    if (!user_id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: userId not found in token." });
    }

    const employee = await prisma.employees.findUnique({
      where: { user_id },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const { filter = "last_5_days" } = req.query; // default to last 5 working days

    const userTimezone = req.headers["x-timezone"]?.toString() || "Asia/Karachi";
    const now = moment().tz(userTimezone);
    const todayDateOnly = now.clone().startOf('day');

    // Get current month boundaries (from 1st to today, not future dates) in user timezone
    const startOfMonth = now.clone().startOf('month').startOf('day');
    const endOfMonth = now.clone().endOf('month').endOf('day');

    // For database query, convert to UTC
    // Query from start of month to end of month (we'll filter to today in the loop)
    const attendanceRecords = await prisma.attendance_records.findMany({
      where: {
        employee_id: employee.id,
        date: {
          gte: startOfMonth.clone().utc().toDate(),
          lte: endOfMonth.clone().utc().toDate(),
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // Create a map of date -> attendance record using the date field
    const attendanceMap = new Map<string, any>();
    attendanceRecords.forEach((record) => {
      // Use the date field instead of clock_in for mapping
      const dateKey = moment(record.date).tz(userTimezone).format('YYYY-MM-DD');
      attendanceMap.set(dateKey, record);
    });

    // Generate all working days (Mon-Fri) from start of month to today (inclusive)
    const allWorkingDays: any[] = [];
    const currentDate = startOfMonth.clone(); // Start from Dec 1 in user timezone

    // Loop through all days up to and including today
    while (currentDate.isSameOrBefore(todayDateOnly, 'day')) {
      const dayOfWeek = currentDate.day(); // 0 = Sunday, 6 = Saturday
      const dateKey = currentDate.format('YYYY-MM-DD');
      const isToday = currentDate.isSame(todayDateOnly, 'day');

      // Include Monday (1) to Friday (5) OR today (regardless of day)
      if ((dayOfWeek >= 1 && dayOfWeek <= 5) || isToday) {
        const attendance = attendanceMap.get(dateKey);

        let status = "Absent";
        let clockIn = null;
        let clockOut = null;
        let workingHours = 0;
        let lateMinutes = null;

        if (attendance) {
          status = attendance.status || "Absent";
          clockIn = attendance.clock_in;
          clockOut = attendance.clock_out;
          lateMinutes = attendance.late_minutes;

          // Calculate working hours if checked out
          if (clockOut && clockIn) {
            workingHours = Number(
              ((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / (1000 * 60 * 60)).toFixed(2)
            );
          }
        }

        allWorkingDays.push({
          date: dateKey,
          day: currentDate.format('dddd'),
          status,
          clock_in: clockIn ? new Date(clockIn).toISOString() : null,
          clock_out: clockOut ? new Date(clockOut).toISOString() : null,
          working_hours: workingHours,
          late_minutes: lateMinutes,
          net_working_minutes: attendance?.net_working_minutes || 0,
        });
      }

      currentDate.add(1, 'day');
    }

    // Count statuses from ALL working days (month-wise)
    const statusCounts = {
      on_time: allWorkingDays.filter(d => d.status === 'on_time').length,
      late: allWorkingDays.filter(d => d.status === 'Late').length,
      approved_late: allWorkingDays.filter(d => d.status === 'approved_late').length,
      absent: allWorkingDays.filter(d => d.status === 'Absent').length,
    };

    // Apply filter to records
    let filteredRecords = allWorkingDays;

    switch (filter) {
      case "last_5_days":
        filteredRecords = allWorkingDays.slice(-5);
        break;

      case "last_week":
        const lastWeekStart = now.clone().subtract(7, 'days').startOf('day');
        filteredRecords = allWorkingDays.filter(d =>
          moment(d.date).isSameOrAfter(lastWeekStart)
        );
        break;

      case "last_2_weeks":
        const last2WeeksStart = now.clone().subtract(14, 'days').startOf('day');
        filteredRecords = allWorkingDays.filter(d =>
          moment(d.date).isSameOrAfter(last2WeeksStart)
        );
        break;

      case "current_month":
        // Already showing current month, so use all
        filteredRecords = allWorkingDays;
        break;

      case "custom":
        // Support custom date range via query params
        const { start_date, end_date } = req.query;
        if (start_date && end_date) {
          const customStart = moment(start_date as string).startOf('day');
          const customEnd = moment(end_date as string).endOf('day');
          filteredRecords = allWorkingDays.filter(d => {
            const recordDate = moment(d.date);
            return recordDate.isSameOrAfter(customStart) && recordDate.isSameOrBefore(customEnd);
          });
        }
        break;

      default:
        // Default to last 5 working days
        filteredRecords = allWorkingDays.slice(-5);
    }

    return res.status(200).json({
      employee_id: employee.id,
      month: now.format('MMMM YYYY'),
      totalWorkingDays: allWorkingDays.length, // Month-wise total
      statusCounts, // Month-wise status counts
      filter: filter || "last_5_days",
      records: filteredRecords, // Filtered records based on filter
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
    const user_id = user.userId;

    const employee = await prisma.employees.findUnique({
      where: { user_id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for this user.",
      });
    }

    const { leaveId, start_date, end_date, reason, approved_by_id } = req.body;

    if (!leaveId || !start_date || !end_date || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const data: any = {
      employee_id: employee.id,
      leave_type_id: leaveId,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      reason,
      status: "Pending",
    };

    if (approved_by_id) {
      data.approved_by_id = approved_by_id;
    }

    const newRequest = await prisma.leave_requests.create({ data });

    const leaveName = await prisma.leave_types.findUnique({
      where: { id: leaveId },
    });
    const empName = await prisma.users.findUnique({
      where: { id: employee.user_id },
    });

    await notifyLeaveApprovers({
      employee_id: employee.id,
      title: "New Leave Request",
      message: `${empName?.full_name} submitted a leave request from ${start_date} to ${end_date} for the ${leaveName?.name}`,
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
    const user_id = user.userId;

    const employee = await prisma.employees.findUnique({
      where: { user_id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const leaveRequests = await prisma.leave_requests.findMany({
      where: { employee_id: employee.id },
      include: {
        leave_type: true,
      },
      orderBy: { requested_at: "desc" },
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
  const { name, description, is_paid, total_days } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });
  }

  try {
    const leaveType = await prisma.leave_types.create({
      data: {
        name,
        description,
        is_paid: is_paid ?? true, // default true if not provided
        total_days: Number(total_days),
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
    const leaveTypes = await prisma.leave_types.findMany();
    // console.log("LEAVE API hit: ", leaveTypes);
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
    const { limit = "5", last_cursor_id } = req.query;

    const limitNumber = parseInt(limit as string);
    // const skip = (pageNumber - 1) * limitNumber;

    const total = await prisma.leave_requests.count({})
    const cursor = last_cursor_id ? { id: last_cursor_id } : undefined
    console.log("Cursor passed to db:", cursor);

    const leave_requests = await prisma.leave_requests.findMany({
      skip: cursor ? 1 : 0,
      take: limitNumber,
      cursor: last_cursor_id ? { id: last_cursor_id as string } : undefined,
      include: {
        leave_type: true,
        employee: {
          include: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        approved_by: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: { requested_at: "desc" },
    });

    return res.status(200).json({
      success: true, data: {
        leave_requests,
        pagination: {
          limit,
          total,
          total_pages: Math.ceil(total / limitNumber)
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

    const current_user_id = (req.user as unknown as CustomJwtPayload).userId;

    // Fetch current user
    const user = await prisma.users.findUnique({
      where: { id: current_user_id },
      include: {
        role: true,
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
    const targetLeaveRequest = await prisma.leave_requests.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              include: {
              },
            },
            department: true,
            // sub_department: true,
          },
        },
      },
    });

    if (!targetLeaveRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found." });
    }

    // // 🔐 Sub-role level checks for non-admins
    // if (roleName !== "admin") {
    //   if (!user.sub_role || typeof user.sub_role.level !== "number") {
    //     return res.status(403).json({
    //       success: false,
    //       message:
    //         "Approver sub-role level not found. Ensure approver has valid subRole assigned.",
    //     });
    //   }

    //   const approverLevel = user.sub_role.level;
    //   const requesterLevel = targetLeaveRequest.employee?.user?.sub_role?.level;

    //   if (requesterLevel === undefined || requesterLevel === null) {
    //     return res.status(403).json({
    //       success: false,
    //       message: "Requester sub-role level not found.",
    //     });
    //   }

    //   if (approverLevel >= requesterLevel) {
    //     return res.status(403).json({
    //       success: false,
    //       message:
    //         "You cannot approve/reject requests of equal or higher-level employees.",
    //     });
    //   }
    // }

    // ✅ Update leave status
    const updated = await prisma.leave_requests.update({
      where: { id },
      data: {
        status,
        approved_at: status === "Approved" ? new Date() : null,
        approved_by_id: current_user_id,
      },
    });

    if (status === "Approved") {
      const employee_id = targetLeaveRequest.employee_id;
      const start_date = new Date(targetLeaveRequest.start_date);
      const end_date = new Date(targetLeaveRequest.end_date);

      // Loop through each day in the leave range
      let currentDate = new Date(start_date);
      while (currentDate <= end_date) {
        const formattedDate = new Date(currentDate);

        // Check if attendance record exists for this date
        const existingRecord = await prisma.attendance_records.findFirst({
          where: {
            employee_id: employee_id,
            date: {
              gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
              lt: new Date(formattedDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (existingRecord) {
          // ✅ Update existing record
          await prisma.attendance_records.update({
            where: { id: existingRecord.id },
            data: { status: "OnLeave", absence_reason: "Leave Approved" },
          });
        } else {
          // ✅ Fetch shift for employee
          const shift = await prisma.shifts.findFirst({
            where: { id: targetLeaveRequest.employee.shift_id! },
          });

          if (!shift) {
            throw new Error("Shift not found for employee.");
          }

          // ✅ Create new record with mandatory fields
          await prisma.attendance_records.create({
            data: {
              employee_id: employee_id,
              date: new Date(formattedDate),
              status: "OnLeave",
              shift_id: shift.id,
              clock_in: shift.start_time, // Assuming shift.start_time is Date
              absence_reason: "Leave Approved",
            },
          });
        }


        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }


    const employeeUser = targetLeaveRequest.employee.user;
    const full_name = `${employeeUser.full_name}`;
    const fromDate = targetLeaveRequest.start_date.toLocaleDateString();
    const toDate = targetLeaveRequest.end_date.toLocaleDateString();

    // 🔔 1. Notify the employee who applied
    await createScopedNotification({
      scope: "EMPLOYEE_ONLY",
      data: {
        title:
          status === "Approved" ? "🎉 Leave Approved" : "⛔ Leave Rejected",
        message:
          status === "Approved"
            ? `${user.full_name} approved your leave from ${fromDate} to ${toDate}.`
            : `Your leave request from ${fromDate} to ${toDate} was rejected.`,
        type: "LeaveRequest",
      },
      target_ids: {
        user_id: employeeUser.id,
      },
      visibilityLevel: 0,
      showPopup: true,
    });

    // 🔔 2. Notify department managers
    if (targetLeaveRequest.employee.department_id) {
      await createScopedNotification({
        scope: "MANAGERS_DEPT",
        data: {
          title: "Leave Request Processed",
          message: `${user.full_name
            } ${status.toLowerCase()} the leave request of ${full_name}.`,
          type: "LeaveRequest",
        },
        target_ids: {
          department_id: targetLeaveRequest.employee.department_id,
        },
        visibilityLevel: 1,
        excludeUserId: current_user_id,
        showPopup: true,
      });
    }

    // 🔔 3. Notify team leads of the same sub-department
    if (targetLeaveRequest.employee.sub_department_id) {
      await createScopedNotification({
        scope: "TEAMLEADS_SUBDEPT",
        data: {
          title: "Leave Request Processed",
          message: `${user.full_name
            } ${status.toLowerCase()} the leave request of ${full_name}.`,
          type: "LeaveRequest",
        },
        target_ids: {
          sub_department_id: targetLeaveRequest.employee.sub_department_id,
        },
        visibilityLevel: 1,
        excludeUserId: current_user_id,
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
    const allAttendance = await prisma.attendance_records.findMany({
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
    const employee_id = req.params.employee_id as string;
    const weekNumber = req.query.week_number ? parseInt(req.query.week_number as string) : undefined;

    if (!employee_id) {
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
    const attendanceData = await prisma.attendance_records.findMany({
      where: {
        employee_id,
        date: { gte: startOfWeek, lte: endOfWeek },
        clock_out: { not: null },
      },
      orderBy: { date: "asc" },
    });

    const result = {
      weeklyWorkedHours: 0,
      weeklyLateMinutes: 0,
      daily: {} as Record<string, {
        clock_in: Date | null;
        clock_out: Date | null;
        hours_worked: number;
        late_minutes: number;
        status: string;
      }>
    };

    for (const record of attendanceData) {
      const { date, clock_in, clock_out, late_minutes, status } = record;
      if (!clock_out || !clock_in) continue;

      const workedHours = (clock_out.getTime() - clock_in.getTime()) / (1000 * 60 * 60);
      const dateKey = new Date(date).toISOString().split("T")[0];

      result.daily[dateKey] = {
        clock_in,
        clock_out,
        hours_worked: workedHours,
        late_minutes: late_minutes || 0,
        status: status || "Pending",
      };

      result.weeklyWorkedHours += workedHours;
      result.weeklyLateMinutes += late_minutes || 0;
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
    const attendanceData = await prisma.attendance_records.findMany({
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
      const { employee_id, clock_in, clock_out, date } = record;
      if (!clock_out) continue; // incomplete record

      const hoursWorked =
        (clock_out.getTime() - clock_in.getTime()) / (1000 * 60 * 60);

      if (!result[employee_id]) {
        result[employee_id] = { weekly: 0, monthly: 0 };
      }

      const recordDate = new Date(date);
      if (recordDate >= startOfWeek) result[employee_id].weekly += hoursWorked;
      if (recordDate >= startOfMonth) result[employee_id].monthly += hoursWorked;
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
    const employee = await prisma.employees.findUnique({
      where: { user_id: user.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // 2. Get today's AttendanceRecord
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
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
    const existingBreak = await prisma.breaks.findFirst({
      where: {
        attendance_record_id: todayAttendance.id,
        break_end: null,
      },
    });

    if (existingBreak) {
      return res.status(400).json({ message: "You are already on a break." });
    }

    // ✅ 4. Find BreakType by name
    const breakTypeRecord = await prisma.break_types.findUnique({
      where: { name: breakType },
    });

    if (!breakTypeRecord) {
      const existingTypes = await prisma.break_types.findMany({
        select: { name: true },
      });
      return res.status(400).json({
        message: `Invalid break type. Available types: ${existingTypes
          .map((b: any) => b.name)
          .join(", ")}`,
      });
    }

    // ✅ 5. Create new break using breakTypeId
    const newBreak = await prisma.breaks.create({
      data: {
        break_start: new Date(),
        break_type_id: breakTypeRecord.id,
        attendance_record_id: todayAttendance.id,
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
    const employee = await prisma.employees.findUnique({
      where: { user_id: user.userId },
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

    const attendance = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
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
    const activeBreak = await prisma.breaks.findFirst({
      where: {
        attendance_record_id: attendance.id,
        break_end: null,
      },
    });

    if (!activeBreak) {
      res.status(400).json({ message: "No active break found to end." });
      return;
    }

    // 4. End the break
    const endedBreak = await prisma.breaks.update({
      where: { id: activeBreak.id },
      data: {
        break_end: new Date(),
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
    const { attendance_record_id } = req.query;

    if (!attendance_record_id || typeof attendance_record_id !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid attendanceRecordId." });
    }

    const breaks = await prisma.breaks.findMany({
      where: { attendance_record_id },
      orderBy: { break_start: "asc" },
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

    const total = await prisma.employees.count({})

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const employees = await prisma.employees.findMany({
      skip: lastCursorId ? 1 : 0,
      take: limitNumber,
      cursor: lastCursorId ? { id: lastCursorId as string } : undefined,
      include: {
        user: { select: { full_name: true, email: true } },
        department: true,
      },
      orderBy: { id: "desc" }
    });

    const summary = await Promise.all(
      employees.map(async (emp: any) => {
        const todayAttendance = await prisma.attendance_records.findFirst({
          where: {
            employee_id: emp.id,
            date: { gte: todayStart, lte: todayEnd },
          },
        });

        const onLeaveToday = await prisma.leave_requests.findFirst({
          where: {
            employee_id: emp.id,
            status: "Approved",
            start_date: { lte: todayStart },
            end_date: { gte: todayEnd },
          },
        });

        let today_status = "Absent";
        if (onLeaveToday) today_status = "OnLeave"
        else if (todayAttendance?.status === "Late") today_status = "Late";
        else if (todayAttendance?.status === "Present") today_status = "Present";
        else if (todayAttendance?.status === "approved_late") today_status = "approved_late";

        const total_leaves = await prisma.leave_requests.count({
          where: {
            employee_id: emp.id,
            status: "Approved",
          },
        });

        const late_arrivals = await prisma.attendance_records.count({
          where: {
            employee_id: emp.id,
            status: "Late",
          },
        });
        return {
          employee_id: emp.id,
          full_name: emp.user.full_name,
          email: emp.user.email,
          department: emp.department?.name || "N/A",
          today_status,
          total_leaves,
          late_arrivals
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: summary,
      pagination: {
        limit,
        total,
        total_pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error("Failed to fetch employee summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getEmployeesAttendanceSummaryFiltered = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      limit = "5",
      lastCursorId,
      filterType,
      startDate,
      endDate,
      departmentId,
      userId,
    } = req.query;

    const limitNumber = parseInt(limit as string);

    const isAdminView = !userId;

    // Default filter type for admin view
    const finalFilterType = filterType ? filterType.toString() : "today";

    // -------------------------
    // FETCH EMPLOYEES
    // -------------------------
    let employees: any[] = [];

    if (userId) {
      const employee = await prisma.employees.findUnique({
        where: { id: userId as string },
        include: {
          user: { select: { full_name: true, email: true } },
          department: true,
        },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      // Department + employee validation
      if (
        departmentId &&
        departmentId !== "All" &&
        employee.department_id !== departmentId
      ) {
        return res.status(400).json({
          success: false,
          message: "Employee does not belong to the specified department.",
        });
      }

      employees = [employee];
    } else {
      // ADMIN MODE → ALL EMPLOYEES (optional department filter)
      employees = await prisma.employees.findMany({
        where: departmentId && departmentId !== "All"
          ? { department_id: departmentId as string }
          : undefined,
        include: {
          user: { select: { full_name: true, email: true } },
          department: true,
        },
      });
    }

    // -------------------------
    // DATE RANGE CALCULATION
    // -------------------------
    let rangeStart: Date, rangeEnd: Date;
    const today = moment().startOf("day");

    switch (finalFilterType.toLowerCase()) {
      case "yesterday":
        rangeStart = today.clone().subtract(1, "day").toDate();
        rangeEnd = today.clone().subtract(1, "day").endOf("day").toDate();
        break;

      case "this_week":
        rangeStart = today.clone().startOf("isoWeek").toDate();
        rangeEnd = today.clone().endOf("isoWeek").toDate();
        break;

      case "last_week":
        rangeStart = today.clone().subtract(1, "week").startOf("isoWeek").toDate();
        rangeEnd = today.clone().subtract(1, "week").endOf("isoWeek").toDate();
        break;

      case "this_month":
        rangeStart = today.clone().startOf("month").toDate();
        rangeEnd = today.clone().endOf("month").toDate();
        break;

      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            message: "Custom range requires startDate and endDate.",
          });
        }
        rangeStart = moment(startDate as string).startOf("day").toDate();
        rangeEnd = moment(endDate as string).endOf("day").toDate();
        break;

      case "specific_date":
        if (!startDate) {
          return res.status(400).json({
            success: false,
            message: "specific_date filter requires startDate.",
          });
        }
        rangeStart = moment(startDate as string).startOf("day").toDate();
        rangeEnd = moment(startDate as string).endOf("day").toDate();
        break;

      case "today":
      default:
        rangeStart = today.toDate();
        rangeEnd = today.clone().endOf("day").toDate();
    }

    // -------------------------
    // FETCH ATTENDANCE RECORDS
    // -------------------------
    const attendanceRecords = await prisma.attendance_records.findMany({
      where: {
        employee_id: { in: employees.map(e => e.id) },
        clock_in: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { clock_in: "asc" },
    });

    // -------------------------
    // BUILD DAILY ROWS
    // -------------------------
    const allDailyAttendance: any[] = [];
    const endMoment = moment(rangeEnd);

    employees.forEach(employee => {
      const recordMap = new Map<string, any>();

      attendanceRecords
        .filter(r => r.employee_id === employee.id)
        .forEach(r => {
          recordMap.set(moment(r.clock_in).format("YYYY-MM-DD"), r);
        });

      const cursor = moment(rangeStart);

      while (cursor.isSameOrBefore(endMoment, "day")) {
        const dateKey = cursor.format("YYYY-MM-DD");
        const dayName = cursor.format("dddd");
        const record = recordMap.get(dateKey);

        const netMinutes = record?.net_working_minutes || 0;
        const status = record?.status || "Absent";

        allDailyAttendance.push({
          employee_id: employee.id,
          full_name: employee.user.full_name,
          email: employee.user.email,
          department: employee.department?.name || "N/A",
          period_status: status,
          total_leaves: 0,
          late_arrivals: status === "Late" ? 1 : 0,
          total_hours: Number((netMinutes / 60).toFixed(2)),
          attendance_days: `${dayName} (${dateKey})`,
          date: dateKey,
          day: dayName,
          check_in: record?.clock_in
            ? moment(record.clock_in).format("HH:mm")
            : null,
          check_out: record?.clock_out
            ? moment(record.clock_out).format("HH:mm")
            : null,
          net_working_minutes: netMinutes,
          late_minutes: record?.late_minutes || null,
        });

        cursor.add(1, "day");
      }
    });

    // -------------------------
    // PAGINATION (DATE CURSOR)
    // -------------------------
    let skipDays = 0;
    if (lastCursorId) {
      const cursorDate = moment(lastCursorId as string, "YYYY-MM-DD", true);
      if (!cursorDate.isValid()) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination cursor. Use YYYY-MM-DD.",
        });
      }
      skipDays = allDailyAttendance.findIndex(
        d => d.date === cursorDate.format("YYYY-MM-DD")
      ) + 1;
    }

    const totalDays = allDailyAttendance.length;
    const dailyAttendance = allDailyAttendance.slice(
      skipDays,
      skipDays + limitNumber
    );

    const nextCursor =
      dailyAttendance.length > 0
        ? dailyAttendance[dailyAttendance.length - 1].date
        : null;

    return res.status(200).json({
      success: true,
      data: dailyAttendance,
      pagination: {
        limit: limitNumber,
        total: totalDays,
        total_pages: Math.ceil(totalDays / limitNumber),
        nextCursor,
      },
      filter: {
        start: rangeStart,
        end: rangeEnd,
        filterType: finalFilterType,
        departmentId,
        userId,
      },
    });
  } catch (error) {
    console.error("Failed to fetch filtered employee summary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
