import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// apply for resignation
export const submitResignation = async (req: Request, res: Response) => {
    try {
        const {
            employeeId,
            resignationDate,
            lastWorkingDay,
            reason,
        } = req.body;

        if (!employeeId || !resignationDate || !lastWorkingDay || !reason) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const resignation = await prisma.resignation.create({
            data: {
                employeeId,
                resignationDate: new Date(resignationDate),
                lastWorkingDay: new Date(lastWorkingDay),
                reason,
                status: 'Pending',
                clearanceStatus: 'NotStarted',
                assetReturnStatus: 'NotReturned',
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
        const isHR = user.role === 'hr' || user.role === 'admin';

        let whereClause = {};

        if (!isHR) {
            // Fetch employeeId using the logged-in userId
            const employee = await prisma.employee.findUnique({
                where: {
                    userId: user.userId,
                },
            });

            if (!employee) return res.status(404).json({ message: 'Employee not found' });

            whereClause = { employeeId: employee.id };
            console.log(`Non-HR user: filtering resignations by employeeId: ${employee.id}`);
        } else {
            console.log('HR/Admin: fetching all resignations without filtering by employeeId');
        }

        const resignations = await prisma.resignation.findMany({
            where: whereClause,
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
                processedBy: {
                    select: {
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                resignationDate: 'desc',
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
    console.log("Body: ", req.body);
    try {
        const { id } = req.params;
        const { status, processedById, remarks, lastWorkingDay } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value. Must be "Approved" or "Rejected".' });
        }

        const existingResignation = await prisma.resignation.findUnique({ where: { id } });
        if (!existingResignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        if (existingResignation.status !== 'Pending') {
            return res.status(400).json({ message: 'This resignation has already been processed.' });
        }

        // ✅ Build update object from scratch
        const dataToUpdate: {
            status: string;
            processedById: string;
            processedAt: Date;
            reviewComments: string;
            lastWorkingDay?: Date;
        } = {
            status,
            processedById,
            processedAt: new Date(),
            reviewComments: remarks,
        };

        // ✅ Only add lastWorkingDay if it's a valid ISO date string
        if (typeof lastWorkingDay === 'string') {
            const parsed = new Date(lastWorkingDay);
            if (!isNaN(parsed.getTime())) {
                dataToUpdate.lastWorkingDay = parsed;
            } else {
                console.warn('Skipping invalid lastWorkingDay:', lastWorkingDay);
            }
        }

        // ✅ Double-check (optional)
        if (
            dataToUpdate.lastWorkingDay &&
            isNaN(dataToUpdate.lastWorkingDay.getTime())
        ) {
            delete dataToUpdate.lastWorkingDay;
        }

        console.log('Final dataToUpdate:', dataToUpdate);


        const updatedResignation = await prisma.resignation.update({
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

        const resignation = await prisma.resignation.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: { fullName: true, email: true },
                        },
                    },
                },
                processedBy: {
                    select: { fullName: true, email: true },
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
        const { reason, lastWorkingDay } = req.body;

        const existingResignation = await prisma.resignation.findUnique({
            where: { id },
        });

        if (!existingResignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        if (existingResignation.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot update resignation that is already processed.' });
        }

        const updatedResignation = await prisma.resignation.update({
            where: { id },
            data: {
                reason,
                lastWorkingDay: new Date(lastWorkingDay),
            },
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

        const resignation = await prisma.resignation.findUnique({
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

        await prisma.resignation.delete({
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
        const { clearanceStatus, assetReturnStatus, status, reviewComments  } = req.body;

        const validClearance = ['NotStarted', 'InProgress', 'Cleared'];
        const validAsset = ['NotReturned', 'PartiallyReturned', 'Returned'];
        const validStatus = ['Pending', 'Approved', 'Rejected'];

        if (
            !validClearance.includes(clearanceStatus) ||
            !validAsset.includes(assetReturnStatus) ||
            !validStatus.includes(status)
        ) {
            return res.status(400).json({ message: 'Invalid status, clearance, or asset return status.' });
        }

        const resignation = await prisma.resignation.findUnique({ where: { id } });

        if (!resignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }

        const updated = await prisma.resignation.update({
            where: { id },
            data: {
                clearanceStatus,
                assetReturnStatus,
                status,
                reviewComments: reviewComments || null,
            },
        });

        return res.status(200).json({ message: 'Statuses updated successfully', data: updated });
    } catch (err) {
        console.error('Error updating statuses:', err);
        return res.status(500).json({ message: 'Server error while updating status' });
    }
};