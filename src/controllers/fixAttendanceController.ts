import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { createScopedNotification, notifyLeaveApprovers } from "../utils/notificationUtils";
import prisma from "../utils/Prisma";
interface CustomJwtPayload extends JwtPayload {
    id: string;
}

// POST /attendance-fix
export const submitFixAttendanceRequest = async (req: Request, res: Response) => {
    try {
        const {
            employee_id,
            date,
            request_type,
            requested_check_in,
            requested_check_out,
            reason
        } = req.body;

        const parsedDate = new Date(date);

        // Step 1: Check if employee was on leave on that day
        const leaveExists = await prisma.leave_requests.findFirst({
            where: {
                employee_id,
                status: 'Approved',
                start_date: { lte: parsedDate },
                end_date: { gte: parsedDate }
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
            request_type === 'CheckIn' || request_type === 'Both'
                ? requested_check_in && !isNaN(new Date(`${date}T${requested_check_in}`).getTime())
                    ? new Date(`${date}T${requested_check_in}`)
                    : null
                : null;

        const validCheckOut =
            request_type === 'CheckOut' || request_type === 'Both'
                ? requested_check_out
                    ? (() => {
                        let out = new Date(`${date}T${requested_check_out}`);
                        if (requested_check_out === '00:00') {
                            // interpret as midnight of next day
                            out.setDate(out.getDate() + 1);
                        }
                        return isNaN(out.getTime()) ? null : out;
                    })()
                    : null
                : null;


        if (!employee_id) {
            return res.status(400).json({ message: 'Employee ID is required.' });
        }


        const attendanceFix = await prisma.attendance_fix_requests.create({
            data: {
                employee: {
                    connect: { id: employee_id }
                },
                request_type,
                requested_check_in: validCheckIn,
                requested_check_out: validCheckOut,
                reason,
                status: 'Pending',
            },
        });
        const emp = await prisma.employees.findUnique({ where: { id: employee_id } })

        const user = await prisma.users.findUnique({
            where: { id: emp?.user_id }
        })

        // ✅ Notify relevant users
        await notifyLeaveApprovers({
            employee_id,
            title: `Attendance Fix Request (${request_type})`,
            message: `An attendance fix request has been submitted by (${user?.full_name}). Reason: ${reason}`,
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
    const reviewer_id = req.user?.userId;
    const { status, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value. Must be 'Approved' or 'Rejected'." });
    }

    try {
        const request = await prisma.attendance_fix_requests.findUnique({
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

        let attendance_record_id = request.attendance_record_id;
        let updatedOrCreatedRecord = null;

        // ✅ If Approved: create or update attendance record
        if (status === "Approved") {
            if (!attendance_record_id) {
                // No attendance record yet → create one
                const newRecord = await prisma.attendance_records.create({
                    data: {
                        employee_id: request.employee_id,
                        date: request.requested_check_in ?? request.requested_check_out ?? new Date(),
                        clock_in: request.requested_check_in ?? new Date(),
                        clock_out: request.requested_check_out ?? null,
                        shift_id: request.employee.shift_id!,
                        status: 'Present',
                    },
                });

                attendance_record_id = newRecord.id;
                updatedOrCreatedRecord = newRecord;

                await prisma.attendance_fix_requests.update({
                    where: { id: requestId },
                    data: { attendance_record_id }
                });
            } else {
                // Update existing record
                updatedOrCreatedRecord = await prisma.attendance_records.update({
                    where: { id: attendance_record_id },
                    data: {
                        clock_in: request.requested_check_in ?? undefined,
                        clock_out: request.requested_check_out ?? undefined,
                    },
                });
            }

            // ✅ Handle requested breaks
            const parsedBreaks = Array.isArray(request.requested_breaks)
                ? request.requested_breaks
                : [];

            if (parsedBreaks.length > 0 && attendance_record_id) {
                await prisma.breaks.deleteMany({ where: { attendance_record_id } });


                await prisma.breaks.createMany({
                    data: parsedBreaks.map((br: any) => ({
                        attendance_record_id: attendance_record_id as string, // ✅ ensured to be string
                        break_start: new Date(br.break_start),
                        break_end: br.break_end ? new Date(br.break_end) : null,
                        break_type_id: br.break_type_id ?? null,
                    })),
                });
            }
        }

        const user = await prisma.users.findUnique({ where: { id: request.employee.user_id } })

        try {
            // 🔔 Prepare notification title and message
            const employeeName = `${user?.full_name}`;
            const approverName = await prisma.users.findUnique({ where: { id: reviewer_id } });
            const isApproved = status === 'Approved';

            const baseNotification = {
                title: `Attendance Fix Request ${status}`,
                message: isApproved
                    ? `Your attendance fix request was approved by ${approverName?.full_name}. Your attendance has been updated.`
                    : `Your attendance fix request was rejected.`,
            };

            // 🔔 Notify EMPLOYEE_ONLY
            await createScopedNotification({
                scope: 'EMPLOYEE_ONLY',
                target_ids: { user_id: request.employee.user_id },
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
                target_ids: {},
                data: commonData,
                visibilityLevel: 1,
                excludeUserId: reviewer_id, // reviewer shouldn’t get self-notification
            });

            // notify managers in same dept
            if (request.employee.department_id) {
                await createScopedNotification({
                    scope: 'MANAGERS_DEPT',
                    target_ids: { department_id: request.employee.department_id },
                    data: commonData,
                    visibilityLevel: 2,
                    excludeUserId: reviewer_id,
                });
            }

            // notify team leads in same sub-dept
            if (request.employee.sub_department_id) {
                await createScopedNotification({
                    scope: 'TEAMLEADS_SUBDEPT',
                    target_ids: { sub_department_id: request.employee.sub_department_id },
                    data: commonData,
                    visibilityLevel: 2,
                    excludeUserId: reviewer_id,
                });
            }

        } catch (error) {

        }

        // ✅ Update fix request status
        const updatedRequest = await prisma.attendance_fix_requests.update({
            where: { id: requestId },
            data: {
                status,
                reviewed_by_id: reviewer_id,
                reviewed_at: new Date(),
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
    const { limit = "5", lastCursorId } = req.query

    const limitNumber = parseInt(limit as string)

    try {
        const reviewer = await prisma.users.findUnique({
            where: { id: reviewerId },
            include: {
                role: true,
                sub_role: true,
            },
        });

        if (!reviewer) {
            return res.status(404).json({ message: "Reviewer not found" });
        }

        // Admin can see all
        if (reviewer.role?.name === "admin") {
            const total = await prisma.attendance_fix_requests.count({})
            const allRequests = await prisma.attendance_fix_requests.findMany({
                skip: lastCursorId ? 1 : 0,
                take: limitNumber,
                cursor: lastCursorId ? { id: lastCursorId as string } : undefined,
                include: {
                    employee: {
                        include: {
                            user: true,
                        },
                    },
                    reviewed_by: true,
                },
                orderBy: {
                    requested_at: 'desc',
                },
            });

            const pagination = {
                limit,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }

            return res.status(200).json({ success: true, data: allRequests, pagination });
        }

        // Sub-role-based access (get requests of users with lower level)
        if (reviewer.sub_role?.level !== undefined) {
            const requests = await prisma.attendance_fix_requests.findMany({
                take: limitNumber,
                skip: lastCursorId ? 1 : 0,
                cursor: localStorage ? { id: lastCursorId as string } : undefined,
                where: {
                    employee: {
                        user: {
                            sub_role: {
                                level: {
                                    gt: reviewer.sub_role.level, // Only lower level
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
                    reviewed_by: true,
                },
                orderBy: {
                    requested_at: 'desc',
                },
            });
            const total = await prisma.attendance_fix_requests.count({})

            const pagination = {
                limit,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }


            return res.status(200).json({ success: true, data: requests, pagination });
        }

        return res.status(403).json({ message: "You are not authorized to view requests" });

    } catch (error) {
        console.error("Error fetching fix requests:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getFixRequestsByEmployee = async (req: Request, res: Response) => {
    const { employee_id } = req.params;

    if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required." });
    }

    try {
        const fixRequests = await prisma.attendance_fix_requests.findMany({
            where: { employee_id },
            include: {
                reviewed_by: {
                    select: { full_name: true }
                },
                employee: {
                    include: {
                        user: {
                            select: { full_name: true }
                        }
                    }
                },
            },
            orderBy: {
                requested_at: 'desc',
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
    const { status, reason, request_type, requestedCheckIn, requestedCheckOut, remarks } = req.body;

    try {
        const existingRequest = await prisma.attendance_fix_requests.findUnique({
            where: { id: requestId },
            include: {
                employee: {
                    include: {
                        user: true,
                        department: true,
                        // sub_department: true
                    }
                }
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ message: 'Fix request not found.' });
        }

        const wasApproved = existingRequest.status === 'Approved';

        // If previously approved and now not approved, delete linked attendance record
        if (wasApproved && status !== 'Approved' && existingRequest.attendance_record_id) {
            await prisma.attendance_records.delete({
                where: { id: existingRequest.attendance_record_id },
            });

            await prisma.attendance_fix_requests.update({
                where: { id: requestId },
                data: { attendance_record_id: null },
            });
        }

        const updatedRequest = await prisma.attendance_fix_requests.update({
            where: { id: requestId },
            data: {
                status,
                reason,
                request_type,
                requested_check_in: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
                requested_check_out: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
                remarks,
                requested_at: new Date(),
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
        const request = await prisma.attendance_fix_requests.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            return res.status(404).json({ message: 'Fix request not found.' });
        }

        // Delete linked attendance record if any
        if (request.attendance_record_id) {
            await prisma.attendance_records.delete({
                where: { id: request.attendance_record_id },
            });
        }

        // Delete the fix request itself
        await prisma.attendance_fix_requests.delete({
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
        const request = await prisma.attendance_fix_requests.findUnique({
            where: { id },
            include: {
                employee: {
                    include: { user: true }
                },
                reviewed_by: true,
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
