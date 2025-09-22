import { Request, Response } from 'express';
import { JwtPayload } from "jsonwebtoken";
import prisma from '../utils/Prisma';

interface CustomJwtPayload extends JwtPayload {
    id: string;
}

// apply for resignation
export const submitResignation = async (req: Request, res: Response) => {
    try {
        const {
            employee_id,
            resignation_date,
            last_working_day,
            reason,
        } = req.body;

        if (!employee_id || !resignation_date || !last_working_day || !reason) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const resignation = await prisma.resignations.create({
            data: {
                employee_id,
                resignation_date: new Date(resignation_date),
                last_working_day: new Date(last_working_day),
                reason,
                status: 'Pending',
                clearance_status: 'NotStarted',
                asset_return_status: 'NotReturned',
            },
        });

        return res.status(201).json(resignation);
    } catch (err) {
        console.error('Resignation submission error:', err);
        return res.status(500).json({ error: 'Something went wrong while submitting resignation.' });
    }
};

// get resignation/s - if HR; all resignations - if emp; only his resignations
export const getResignations = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const user = req.user;

        let whereClause = {};

        const resignations = await prisma.resignations.findMany({
            where: whereClause,
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                full_name: true,
                                email: true,
                            },
                        },
                    },
                },
                processed_by: {
                    select: {
                        full_name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                resignation_date: 'desc',
            },
        });

        console.log('Found resignations:', resignations.length);
        return res.status(200).json({ data: resignations });

    } catch (error) {
        console.error('Failed to fetch resignations:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// approve or reject resignation
export const processResignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, remarks, last_working_day } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use "Approved" or "Rejected".' });
        }

        const current_user_id = (req.user as unknown as CustomJwtPayload).userId;

        // Step 1: Get the approver's role and sub-role level
        const approver = await prisma.users.findUnique({
            where: { id: current_user_id },
            include: {
                role: true,
                sub_role: true,
            },
        });

        if (!approver) {
            return res.status(404).json({ message: 'Approver not found.' });
        }

        const roleName = approver.role?.name;

        if (!roleName) {
            return res.status(403).json({ message: 'Role not assigned to approver.' });
        }

        // Step 2: Get the resignation request and requester's level
        const existingResignation = await prisma.resignations.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            include: {
                                sub_role: true,
                            },
                        },
                    },
                },
            },
        });

        if (!existingResignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        if (existingResignation.status !== 'Pending') {
            return res.status(400).json({ message: 'This resignation has already been processed.' });
        }

        // If not admin, enforce hierarchy level check
        if (roleName !== 'admin') {
            const approverLevel = approver.sub_role?.level;
            const requesterLevel = existingResignation.employee?.user?.sub_role?.level;

            if (approverLevel === undefined || requesterLevel === undefined) {
                return res.status(403).json({ message: 'Sub-role level missing for either approver or requester.' });
            }

            if (approverLevel >= requesterLevel) {
                return res.status(403).json({
                    message: 'You cannot approve/reject resignations of users at equal or higher sub-role level.',
                });
            }

        }

        // ✅ Prepare update data
        const dataToUpdate: {
            status: string;
            processed_by_id: string;
            processed_at: Date;
            review_comments: string;
            last_working_day?: Date;
        } = {
            status,
            processed_by_id: current_user_id,
            processed_at: new Date(),
            review_comments: remarks,
        };

        // ✅ Optional: Parse and validate lastWorkingDay
        if (typeof last_working_day === 'string') {
            const parsed = new Date(last_working_day);
            if (!isNaN(parsed.getTime())) {
                dataToUpdate.last_working_day = parsed;
            }
        }

        const updatedResignation = await prisma.resignations.update({
            where: { id },
            data: dataToUpdate,
        });

        return res.status(200).json({
            message: `Resignation ${status.toLowerCase()} successfully.`,
            data: updatedResignation,
        });

    } catch (err) {
        console.error('Error processing resignation:', err);
        return res.status(500).json({ message: 'Error processing resignation.' });
    }
};

// get single Resignation
export const getResignationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const resignation = await prisma.resignations.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: { full_name: true, email: true },
                        },
                    },
                },
                processed_by: {
                    select: { full_name: true, email: true },
                },
            },
        });

        if (!resignation) {
            return res.status(404).json({ message: 'Resignation not found' });
        }

        return res.status(200).json({ data: resignation });
    } catch (err) {
        console.error('Error fetching resignation by ID:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// update resignation (only if status is 'Pending')
export const updateResignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason, last_working_day } = req.body;

        const existingResignation = await prisma.resignations.findUnique({
            where: { id },
        });

        if (!existingResignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        if (existingResignation.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot update resignation that is already processed.' });
        }

        // Build update object dynamically to avoid sending invalid values
        const updateData: {
            reason?: string;
            last_working_day?: Date;
        } = {};

        if (typeof reason === 'string') {
            updateData.reason = reason.trim();
        }

        if (last_working_day) {
            const parsedDate = new Date(last_working_day);
            if (!isNaN(parsedDate.getTime())) {
                updateData.last_working_day = parsedDate;
            }
        } else {
            console.warn('Invalid last_working_day provided. Skipping update for last_working_day.');
        }

        const updatedResignation = await prisma.resignations.update({
            where: { id },
            data: updateData,
        });

        return res.status(200).json({ message: 'Resignation updated successfully', data: updatedResignation });
    } catch (err) {
        console.error('Error updating resignation:', err);
        return res.status(500).json({ message: 'Server error while updating resignation' });
    }
};

// delete resignation (HR can delete any; others only if status is 'Pending')
export const deleteResignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User info missing.' });
        }

        const { role } = req.user;

        const resignation = await prisma.resignations.findUnique({
            where: { id },
        });

        if (!resignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        if (role !== 'hr' && resignation.status !== 'Pending') {
            return res.status(400).json({
                message: 'Only pending resignations can be deleted by non-HR users.',
            });
        }

        await prisma.resignations.delete({
            where: { id },
        });

        return res.status(200).json({ message: 'Resignation deleted successfully.' });
    } catch (err) {
        console.error('Error deleting resignation:', err);
        return res.status(500).json({ message: 'Server error while deleting resignation' });
    }
};

// update clearance and asset return status
export const updateClearanceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { clearance_status, asset_return_status, status, review_comments } = req.body;

        const validClearance = ['NotStarted', 'InProgress', 'Cleared'];
        const validAsset = ['NotReturned', 'PartiallyReturned', 'Returned'];
        const validStatus = ['Pending', 'Approved', 'Rejected'];

        if (
            !validClearance.includes(clearance_status) ||
            !validAsset.includes(asset_return_status) ||
            !validStatus.includes(status)
        ) {
            return res.status(400).json({ message: 'Invalid status, clearance, or asset return status.' });
        }

        const resignation = await prisma.resignations.findUnique({ where: { id } });

        if (!resignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        const updated = await prisma.resignations.update({
            where: { id },
            data: {
                clearance_status,
                asset_return_status,
                status,
                review_comments: review_comments || null,
            },
        });

        return res.status(200).json({ message: 'Statuses updated successfully', data: updated });
    } catch (err) {
        console.error('Error updating statuses:', err);
        return res.status(500).json({ message: 'Server error while updating status' });
    }
};

// GET MY Resignation
export const getMyResignation = async (req: Request, res: Response) => {
    try {
        const user_id = (req.user as unknown as CustomJwtPayload).userId;

        // Fetch resignation of the employee linked to this user
        const employee = await prisma.employees.findUnique({
            where: { user_id },
            select: { id: true },
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee record not found.' });
        }

        const resignation = await prisma.resignations.findFirst({
            where: { employee_id: employee.id },
            include: {
                employee: {
                    include: {
                        user: { select: { full_name: true, email: true } },
                    },
                },
                processed_by: {
                    select: { full_name: true, email: true },
                },
            },
        });

        if (!resignation) {
            return res.status(200).json({ message: 'No resignation submitted.' });
        }

        return res.status(200).json({ data: resignation });
    } catch (err) {
        console.error('Error fetching resignation:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
