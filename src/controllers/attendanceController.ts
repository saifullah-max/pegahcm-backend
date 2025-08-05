import { NextFunction, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from "jsonwebtoken";
const prisma = new PrismaClient();

interface CustomJwtPayload extends JwtPayload {
    id: string;
}

// POST /api/attendance/check-in
export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user as unknown as CustomJwtPayload;
        const userId = user.userId;

        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            res.status(404).json({ message: "Employee not found for this user." });
            return;
        }

        const employeeId = employee.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const isOnLeaveToday = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: "Approved",
                startDate: { lte: todayStart },
                endDate: { gte: todayEnd },
            },
        });

        if (isOnLeaveToday) {
            res.status(403).json({ message: "Cannot check-in while on leave." });
            return;
        }


        const existing = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId,
                date: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        if (existing) {
            res.status(400).json({ message: "Already checked in today." });
            return;
        }

        const { shiftId } = req.body;

        const newRecord = await prisma.attendanceRecord.create({
            data: {
                employeeId,
                date: new Date(),
                clockIn: new Date(),
                shiftId,
                status: "Present",
            },
        });

        res.status(200).json({ message: "Check-in successful", attendance: newRecord });
    } catch (err) {
        console.error("Check-in error:", err);
        next(err);
    }
};

// POST /api/attendance/check-out
export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user as unknown as CustomJwtPayload;
        const userId = user.userId;

        const employee = await prisma.employee.findUnique({
            where: { userId },
        });

        if (!employee) {
            res.status(404).json({ message: "Employee not found for this user." });
            return;
        }

        const employeeId = employee.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendance = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId,
                date: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        if (!attendance || !attendance.clockIn) {
            res.status(400).json({ message: "No check-in record found for today." });
            return;
        }

        if (attendance.clockOut) {
            res.status(400).json({ message: "Already checked out today." });
            return;
        }

        const clockIn = new Date(attendance.clockIn);
        const clockOut = new Date();

        // Fetch all breaks for this attendance
        const breaks = await prisma.break.findMany({
            where: { attendanceRecordId: attendance.id },
        });

        let totalBreakMs = 0;
        for (const brk of breaks) {
            if (brk.breakStart && brk.breakEnd) {
                const start = new Date(brk.breakStart).getTime();
                const end = new Date(brk.breakEnd).getTime();
                totalBreakMs += end - start;
            }
        }

        const totalWorkMs = clockOut.getTime() - clockIn.getTime();
        const netWorkingMinutes = Math.floor((totalWorkMs - totalBreakMs) / (1000 * 60));

        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: attendance.id },
            data: {
                clockOut,
                netWorkingMinutes,
            },
        });

        res.status(200).json({ message: "Check-out successful", attendance: updatedRecord });
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
            return res.status(401).json({ message: "Unauthorized: userId not found in token." });
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
                    orderBy: { breakStart: 'asc' },
                    include: { breakType: true },
                },
            },
        });

        if (!attendance) {
            return res.status(200).json({ checkedIn: false, checkedOut: false });
        }

        let activeBreak = null;

        if (attendance) {
            const ongoing = attendance.breaks.find(b => b.breakEnd === null);
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
            return res.status(401).json({ message: "Unauthorized: userId not found in token." });
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
                clockIn: 'desc', // Optional: latest first
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
            status: 'Pending',
        };

        if (approvedById) {
            data.approvedById = approvedById;
        }

        const newRequest = await prisma.leaveRequest.create({ data });

        return res.status(201).json({ success: true, data: newRequest });
    } catch (error) {
        console.error('Error creating leave request:', error);
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
                message: 'Employee not found.',
            });
        }

        const leaveRequests = await prisma.leaveRequest.findMany({
            where: { employeeId: employee.id },
            include: {
                leaveType: true,
            },
            orderBy: { requestedAt: 'desc' },
        });

        return res.status(200).json({
            success: true,
            data: leaveRequests,
        });
    } catch (error) {
        console.error('Error fetching employee leave requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};

export const createLeaveType = async (req: Request, res: Response) => {
    const { name, description, isPaid } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required' });
    }

    try {
        const leaveType = await prisma.leaveType.create({
            data: {
                name,
                description,
                isPaid: isPaid ?? true, // default true if not provided
            },
        });

        return res.status(201).json({ success: true, data: leaveType });
    } catch (error: any) {
        console.error('Error creating leave type:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Leave type with this name already exists',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error while creating leave type',
        });
    }
};

export const getAllLeaveTypes = async (req: Request, res: Response) => {
    try {
        const leaveTypes = await prisma.leaveType.findMany();
        console.log("LEAVE API hit: ", leaveTypes);
        return res.status(200).json({ success: true, data: leaveTypes });
    } catch (error) {
        console.error('Error fetching leave types:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching leave types',
        });
    }
};

// GET /api/admin/leave-requests
export const getAllLeaveRequestsForAdmin = async (req: Request, res: Response) => {
    try {
        const leaveRequests = await prisma.leaveRequest.findMany({
            include: {
                leaveType: true,
                employee: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                            }
                        }
                    }
                },
                approvedBy: {
                    select: {
                        fullName: true
                    }
                }
            },
            orderBy: { requestedAt: 'desc' },
        });

        return res.status(200).json({ success: true, data: leaveRequests });
    } catch (error) {
        console.error('Error fetching leave requests for admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching leave requests',
        });
    }
};

// approve - reject leave request
export const updateLeaveStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const currentUserId = (req.user as unknown as CustomJwtPayload).userId;

        // Fetch current user (includes both Admin and User roles)
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: {
                role: true,
                subRole: true,
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const roleName = user.role?.name;

        if (!roleName) {
            return res.status(403).json({ success: false, message: 'User has no role assigned.' });
        }

        // Only perform sub-role comparison for non-admin users
        if (roleName !== 'admin') {
            if (!user.subRole || typeof user.subRole.level !== 'number') {
                return res.status(403).json({
                    success: false,
                    message: 'Approver sub-role level not found. Ensure approver has valid subRole assigned.',
                });
            }

            const approverLevel = user.subRole.level;

            // Get requester level
            const leaveRequest = await prisma.leaveRequest.findUnique({
                where: { id },
                include: {
                    employee: {
                        include: {
                            user: {
                                include: {
                                    subRole: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!leaveRequest) {
                return res.status(404).json({ success: false, message: 'Leave request not found.' });
            }

            const requesterLevel = leaveRequest.employee?.user?.subRole?.level;

            if (requesterLevel === undefined || requesterLevel === null) {
                return res.status(403).json({
                    success: false,
                    message: 'Requester sub-role level not found.',
                });
            }

            if (approverLevel >= requesterLevel) {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot approve/reject requests of equal or higher-level employees.',
                });
            }
        }

        // Update leave request
        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedAt: status === 'Approved' ? new Date() : null,
                approvedById: currentUserId,
            },
        });

        return res.status(200).json({ success: true, data: updated });

    } catch (error) {
        console.error('Error updating leave request:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating leave request',
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

            const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);


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
export const createBreak = async (req: Request, res: Response, next: NextFunction) => {
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
            return res.status(404).json({ message: "No attendance record found for today." });
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
            const existingTypes = await prisma.breakType.findMany({ select: { name: true } });
            return res.status(400).json({
                message: `Invalid break type. Available types: ${existingTypes.map(b => b.name).join(", ")}`,
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
export const endBreak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            res.status(400).json({ message: "No attendance record found for today." });
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

        res.status(200).json({ message: "Break ended successfully.", break: endedBreak });
    } catch (err) {
        console.error("Error ending break:", err);
        next(err);
    }
};

// GET - all breaks by attendance Recordac
export const getBreaksByAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { attendanceRecordId } = req.query;

        if (!attendanceRecordId || typeof attendanceRecordId !== "string") {
            return res.status(400).json({ message: "Missing or invalid attendanceRecordId." });
        }

        const breaks = await prisma.break.findMany({
            where: { attendanceRecordId },
            orderBy: { breakStart: 'asc' },
        });

        res.status(200).json({ breaks });
    } catch (error) {
        console.error("Error fetching breaks:", error);
        next(error);
    }
};

// Employee summary
export const getEmployeesAttendanceSummary = async (req: Request, res: Response) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const employees = await prisma.employee.findMany({
            include: {
                user: { select: { fullName: true, email: true } },
                department: true,
            },
        });

        const summary = await Promise.all(employees.map(async (emp) => {
            const todayAttendance = await prisma.attendanceRecord.findFirst({
                where: {
                    employeeId: emp.id,
                    date: { gte: todayStart, lte: todayEnd },
                },
            });

            const onLeaveToday = await prisma.leaveRequest.findFirst({
                where: {
                    employeeId: emp.id,
                    status: 'Approved',
                    startDate: { lte: todayStart },
                    endDate: { gte: todayEnd },
                },
            });

            let todayStatus = 'Absent';
            if (onLeaveToday) {
                todayStatus = 'On Leave';
            } else if (todayAttendance?.status === 'Late Arrival') {
                todayStatus = 'Late Arrival';
            } else if (todayAttendance?.status === 'Present') {
                todayStatus = 'Present';
            }

            const totalLeaves = await prisma.leaveRequest.count({
                where: {
                    employeeId: emp.id,
                    status: 'Approved',
                },
            });

            const lateArrivals = await prisma.attendanceRecord.count({
                where: {
                    employeeId: emp.id,
                    status: 'Late Arrival',
                },
            });

            return {
                employeeId: emp.id,
                fullName: emp.user.fullName,
                email: emp.user.email,
                department: emp.department?.name || 'N/A',
                todayStatus,
                totalLeaves,
                lateArrivals,
            };
        }));

        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        console.error("Failed to fetch employee summary:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
