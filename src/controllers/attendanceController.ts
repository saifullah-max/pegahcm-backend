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

        if (!attendance) {
            res.status(400).json({ message: "No check-in record found for today." });
            return;
        }

        if (attendance.clockOut) {
            res.status(400).json({ message: "Already checked out today." });
            return;
        }

        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: attendance.id },
            data: {
                clockOut: new Date(),
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
        });

        if (!attendance) {
            return res.status(200).json({ checkedIn: false, checkedOut: false });
        }

        return res.status(200).json({
            checkedIn: true,
            checkedOut: attendance.clockOut !== null,
            attendance,
        });
    } catch (error) {
        console.error("Error checking today’s attendance:", error);
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

        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedAt: status === 'Approved' ? new Date() : null,
                approvedById: (req.user as unknown as CustomJwtPayload).userId, // assuming JWT contains admin userId
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
