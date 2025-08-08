import { NextFunction, Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from "jsonwebtoken";
import { createScopedNotification, notifyLeaveApprovers } from "../utils/notificationUtils";
const prisma = new PrismaClient();

interface CustomJwtPayload extends JwtPayload {
    id: string;
}

// POST /attendance-fix
export const submitFixAttendanceRequest = async (req: Request, res: Response) => {
    try {
        const {
            employeeId,
            date,
            requestType,
            requestedCheckIn,
            requestedCheckOut,
            reason
        } = req.body;

        const parsedDate = new Date(date);

        // Step 1: Check if employee was on leave on that day
        const leaveExists = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: 'Approved',
                startDate: { lte: parsedDate },
                endDate: { gte: parsedDate }
            }
        });

        if (leaveExists) {
            return res.status(400).json({
                message: 'Attendance fix request denied. You were on approved leave that day.'
            });
        }

        // Step 3: Insert AttendanceFixRequest
        // Validate requestedCheckIn and requestedCheckOut before using them
        const validCheckIn =
            requestType === 'CheckIn' || requestType === 'Both'
                ? requestedCheckIn && !isNaN(new Date(`${date}T${requestedCheckIn}`).getTime())
                    ? new Date(`${date}T${requestedCheckIn}`)
                    : null
                : null;

        const validCheckOut =
            requestType === 'CheckOut' || requestType === 'Both'
                ? requestedCheckOut
                    ? (() => {
                        let out = new Date(`${date}T${requestedCheckOut}`);
                        if (requestedCheckOut === '00:00') {
                            // interpret as midnight of next day
                            out.setDate(out.getDate() + 1);
                        }
                        return isNaN(out.getTime()) ? null : out;
                    })()
                    : null
                : null;


        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required.' });
        }


        const attendanceFix = await prisma.attendanceFixRequest.create({
            data: {
                employee: {
                    connect: { id: employeeId }
                },
                requestType,
                requestedCheckIn: validCheckIn,
                requestedCheckOut: validCheckOut,
                reason,
                status: 'Pending',
            },
        });
        const emp = await prisma.employee.findUnique({ where: { id: employeeId } })

        const user = await prisma.user.findUnique({
            where: { id: emp?.userId }
        })

        // ✅ Notify relevant users
        await notifyLeaveApprovers({
            employeeId,
            title: `Attendance Fix Request (${requestType})`,
            message: `An attendance fix request has been submitted by (${user?.fullName}). Reason: ${reason}`,
            showPopup: true,
        });

        return res.status(201).json({ message: 'Attendance fix request submitted.', data: attendanceFix });

    } catch (error) {
        console.error('Error submitting fix request:', error);
        return res.status(500).json({ message: 'Something went wrong while submitting fix request.' });
    }
};

export const updateFixRequestStatus = async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const reviewerId = req.user?.userId;
    const { status, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value. Must be 'Approved' or 'Rejected'." });
    }

    try {
        const request = await prisma.attendanceFixRequest.findUnique({
            where: { id: requestId },
            include: {
                employee: true,
            },
        });

        if (!request) {
            return res.status(404).json({ message: "Fix request not found." });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({ message: "Only pending requests can be approved or rejected." });
        }

        let attendanceRecordId = request.attendanceRecordId;
        let updatedOrCreatedRecord = null;

        // ✅ If Approved: create or update attendance record
        if (status === "Approved") {
            if (!attendanceRecordId) {
                // No attendance record yet → create one
                const newRecord = await prisma.attendanceRecord.create({
                    data: {
                        employeeId: request.employeeId,
                        date: request.requestedCheckIn ?? request.requestedCheckOut ?? new Date(),
                        clockIn: request.requestedCheckIn ?? new Date(),
                        clockOut: request.requestedCheckOut ?? null,
                        shiftId: request.employee.shiftId!,
                        status: 'Present',
                    },
                });

                attendanceRecordId = newRecord.id;
                updatedOrCreatedRecord = newRecord;

                await prisma.attendanceFixRequest.update({
                    where: { id: requestId },
                    data: { attendanceRecordId }
                });
            } else {
                // Update existing record
                updatedOrCreatedRecord = await prisma.attendanceRecord.update({
                    where: { id: attendanceRecordId },
                    data: {
                        clockIn: request.requestedCheckIn ?? undefined,
                        clockOut: request.requestedCheckOut ?? undefined,
                    },
                });
            }

            // ✅ Handle requested breaks
            const parsedBreaks = Array.isArray(request.requestedBreaks)
                ? request.requestedBreaks
                : [];

            if (parsedBreaks.length > 0 && attendanceRecordId) {
                await prisma.break.deleteMany({ where: { attendanceRecordId } });


                await prisma.break.createMany({
                    data: parsedBreaks.map((br: any) => ({
                        attendanceRecordId: attendanceRecordId as string, // ✅ ensured to be string
                        breakStart: new Date(br.breakStart),
                        breakEnd: br.breakEnd ? new Date(br.breakEnd) : null,
                        breakTypeId: br.breakTypeId ?? null,
                    })),
                });
            }
        }

        const user = await prisma.user.findUnique({ where: { id: request.employee.userId } })

        try {
            // 🔔 Prepare notification title and message
            const employeeName = `${user?.fullName}`;
            const approverName = await prisma.user.findUnique({ where: { id: reviewerId } });
            const isApproved = status === 'Approved';

            const baseNotification = {
                title: `Attendance Fix Request ${status}`,
                message: isApproved
                    ? `Your attendance fix request was approved by ${approverName?.fullName}. Your attendance has been updated.`
                    : `Your attendance fix request was rejected.`,
            };

            // 🔔 Notify EMPLOYEE_ONLY
            await createScopedNotification({
                scope: 'EMPLOYEE_ONLY',
                targetIds: { userId: request.employee.userId },
                data: {
                    title: baseNotification.title,
                    message: baseNotification.message,
                    type: 'INFO',
                },
                visibilityLevel: 3,
                showPopup: true
            });

            // 🔔 Notify others (managers, directors, team leads, HR)
            const commonData = {
                title: `Attendance Fix Request ${status}`,
                message: `${employeeName}'s attendance fix request was ${status.toLowerCase()}.`,
                type: 'INFO',
            };

            // notify HR (DIRECTORS_HR)
            await createScopedNotification({
                scope: 'DIRECTORS_HR',
                targetIds: {},
                data: commonData,
                visibilityLevel: 1,
                excludeUserId: reviewerId, // reviewer shouldn’t get self-notification
            });

            // notify managers in same dept
            if (request.employee.departmentId) {
                await createScopedNotification({
                    scope: 'MANAGERS_DEPT',
                    targetIds: { departmentId: request.employee.departmentId },
                    data: commonData,
                    visibilityLevel: 2,
                    excludeUserId: reviewerId,
                });
            }

            // notify team leads in same sub-dept
            if (request.employee.subDepartmentId) {
                await createScopedNotification({
                    scope: 'TEAMLEADS_SUBDEPT',
                    targetIds: { subDepartmentId: request.employee.subDepartmentId },
                    data: commonData,
                    visibilityLevel: 2,
                    excludeUserId: reviewerId,
                });
            }

        } catch (error) {

        }

        // ✅ Update fix request status
        const updatedRequest = await prisma.attendanceFixRequest.update({
            where: { id: requestId },
            data: {
                status,
                reviewedById: reviewerId,
                reviewedAt: new Date(),
                remarks: remarks ?? undefined,
            },
        });

        res.status(200).json({
            message: `Fix request ${status.toLowerCase()} successfully.`,
            request: updatedRequest,
            attendanceRecord: updatedOrCreatedRecord,
        });
    } catch (error) {
        console.error("Error updating fix request status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET /attendance-fix
export const getAllFixRequests = async (req: Request, res: Response) => {
    const reviewerId = req.user?.userId;

    try {
        const reviewer = await prisma.user.findUnique({
            where: { id: reviewerId },
            include: {
                role: true,
                subRole: true,
            },
        });

        if (!reviewer) {
            return res.status(404).json({ message: "Reviewer not found" });
        }

        // Admin can see all
        if (reviewer.role?.name === "admin") {
            const allRequests = await prisma.attendanceFixRequest.findMany({
                include: {
                    employee: {
                        include: {
                            user: true,
                        },
                    },
                    reviewedBy: true,
                },
                orderBy: {
                    requestedAt: 'desc',
                },
            });

            return res.status(200).json({ success: true, data: allRequests });
        }

        // Sub-role-based access (get requests of users with lower level)
        if (reviewer.subRole?.level !== undefined) {
            const requests = await prisma.attendanceFixRequest.findMany({
                where: {
                    employee: {
                        user: {
                            subRole: {
                                level: {
                                    gt: reviewer.subRole.level, // Only lower level
                                },
                            },
                        },
                    },
                },
                include: {
                    employee: {
                        include: {
                            user: true,
                        },
                    },
                    reviewedBy: true,
                },
                orderBy: {
                    requestedAt: 'desc',
                },
            });

            return res.status(200).json({ success: true, data: requests });
        }

        return res.status(403).json({ message: "You are not authorized to view requests" });

    } catch (error) {
        console.error("Error fetching fix requests:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getFixRequestsByEmployee = async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required." });
    }

    try {
        const fixRequests = await prisma.attendanceFixRequest.findMany({
            where: { employeeId },
            include: {
                reviewedBy: {
                    select: { fullName: true }
                },
                employee: {
                    include: {
                        user: {
                            select: { fullName: true }
                        }
                    }
                },
            },
            orderBy: {
                requestedAt: 'desc',
            },
        });

        return res.status(200).json({ success: true, data: fixRequests });
    } catch (error) {
        console.error("Error fetching employee fix requests:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// update data 
export const editFixRequest = async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const { status, reason, requestType, requestedCheckIn, requestedCheckOut, remarks } = req.body;

    try {
        const existingRequest = await prisma.attendanceFixRequest.findUnique({
            where: { id: requestId },
            include: {
                employee: {
                    include: {
                        user: true,
                        department: true,
                        subDepartment: true
                    }
                }
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ message: 'Fix request not found.' });
        }

        const wasApproved = existingRequest.status === 'Approved';

        // If previously approved and now not approved, delete linked attendance record
        if (wasApproved && status !== 'Approved' && existingRequest.attendanceRecordId) {
            await prisma.attendanceRecord.delete({
                where: { id: existingRequest.attendanceRecordId },
            });

            await prisma.attendanceFixRequest.update({
                where: { id: requestId },
                data: { attendanceRecordId: null },
            });
        }

        const updatedRequest = await prisma.attendanceFixRequest.update({
            where: { id: requestId },
            data: {
                status,
                reason,
                requestType,
                requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
                requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
                remarks,
                reviewedAt: new Date(),
            },
        });

        return res.status(200).json({ message: 'Fix request updated.', data: updatedRequest });
    } catch (error) {
        console.error('Error editing fix request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// delete entry
export const deleteFixRequest = async (req: Request, res: Response) => {
    const requestId = req.params.id;

    try {
        const request = await prisma.attendanceFixRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            return res.status(404).json({ message: 'Fix request not found.' });
        }

        // Delete linked attendance record if any
        if (request.attendanceRecordId) {
            await prisma.attendanceRecord.delete({
                where: { id: request.attendanceRecordId },
            });
        }

        // Delete the fix request itself
        await prisma.attendanceFixRequest.delete({
            where: { id: requestId },
        });

        return res.status(200).json({ message: 'Fix request deleted successfully.' });
    } catch (error) {
        console.error('Error deleting fix request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// get single fix attendance entry
export const getFixRequestById = async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
        const request = await prisma.attendanceFixRequest.findUnique({
            where: { id },
            include: {
                employee: {
                    include: { user: true }
                },
                reviewedBy: true,
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Fix request not found' });
        }

        res.status(200).json(request);
    } catch (error) {
        console.error('Error fetching fix request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
