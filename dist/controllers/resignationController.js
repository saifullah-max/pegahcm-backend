"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyResignation = exports.updateClearanceStatus = exports.deleteResignation = exports.updateResignation = exports.getResignationById = exports.processResignation = exports.getResignations = exports.submitResignation = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
// apply for resignation
const submitResignation = async (req, res) => {
    try {
        const { employeeId, resignationDate, lastWorkingDay, reason, } = req.body;
        if (!employeeId || !resignationDate || !lastWorkingDay || !reason) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const resignation = await Prisma_1.default.resignation.create({
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
    }
    catch (err) {
        console.error('Resignation submission error:', err);
        return res.status(500).json({ error: 'Something went wrong while submitting resignation.' });
    }
};
exports.submitResignation = submitResignation;
// get resignation/s - if HR; all resignations - if emp; only his resignations
const getResignations = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = req.user;
        let whereClause = {};
        const resignations = await Prisma_1.default.resignation.findMany({
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
    }
    catch (error) {
        console.error('Failed to fetch resignations:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getResignations = getResignations;
// approve or reject resignation
const processResignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks, lastWorkingDay } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use "Approved" or "Rejected".' });
        }
        const currentUserId = req.user.userId;
        // Step 1: Get the approver's role and sub-role level
        const approver = await Prisma_1.default.user.findUnique({
            where: { id: currentUserId },
            include: {
                role: true,
                subRole: true,
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
        const existingResignation = await Prisma_1.default.resignation.findUnique({
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
        if (!existingResignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }
        if (existingResignation.status !== 'Pending') {
            return res.status(400).json({ message: 'This resignation has already been processed.' });
        }
        // If not admin, enforce hierarchy level check
        if (roleName !== 'admin') {
            const approverLevel = approver.subRole?.level;
            const requesterLevel = existingResignation.employee?.user?.subRole?.level;
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
        const dataToUpdate = {
            status,
            processedById: currentUserId,
            processedAt: new Date(),
            reviewComments: remarks,
        };
        // ✅ Optional: Parse and validate lastWorkingDay
        if (typeof lastWorkingDay === 'string') {
            const parsed = new Date(lastWorkingDay);
            if (!isNaN(parsed.getTime())) {
                dataToUpdate.lastWorkingDay = parsed;
            }
        }
        const updatedResignation = await Prisma_1.default.resignation.update({
            where: { id },
            data: dataToUpdate,
        });
        return res.status(200).json({
            message: `Resignation ${status.toLowerCase()} successfully.`,
            data: updatedResignation,
        });
    }
    catch (err) {
        console.error('Error processing resignation:', err);
        return res.status(500).json({ message: 'Error processing resignation.' });
    }
};
exports.processResignation = processResignation;
// get single Resignation
const getResignationById = async (req, res) => {
    try {
        const { id } = req.params;
        const resignation = await Prisma_1.default.resignation.findUnique({
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
    }
    catch (err) {
        console.error('Error fetching resignation by ID:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getResignationById = getResignationById;
// update resignation (only if status is 'Pending')
const updateResignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, lastWorkingDay } = req.body;
        const existingResignation = await Prisma_1.default.resignation.findUnique({
            where: { id },
        });
        if (!existingResignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }
        if (existingResignation.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot update resignation that is already processed.' });
        }
        // Build update object dynamically to avoid sending invalid values
        const updateData = {};
        if (typeof reason === 'string') {
            updateData.reason = reason.trim();
        }
        if (lastWorkingDay) {
            const parsedDate = new Date(lastWorkingDay);
            if (!isNaN(parsedDate.getTime())) {
                updateData.lastWorkingDay = parsedDate;
            }
            else {
                console.warn('Invalid lastWorkingDay provided. Skipping update for lastWorkingDay.');
            }
        }
        const updatedResignation = await Prisma_1.default.resignation.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json({ message: 'Resignation updated successfully', data: updatedResignation });
    }
    catch (err) {
        console.error('Error updating resignation:', err);
        return res.status(500).json({ message: 'Server error while updating resignation' });
    }
};
exports.updateResignation = updateResignation;
// delete resignation (HR can delete any; others only if status is 'Pending')
const deleteResignation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User info missing.' });
        }
        const { role } = req.user;
        const resignation = await Prisma_1.default.resignation.findUnique({
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
        await Prisma_1.default.resignation.delete({
            where: { id },
        });
        return res.status(200).json({ message: 'Resignation deleted successfully.' });
    }
    catch (err) {
        console.error('Error deleting resignation:', err);
        return res.status(500).json({ message: 'Server error while deleting resignation' });
    }
};
exports.deleteResignation = deleteResignation;
// update clearance and asset return status
const updateClearanceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { clearanceStatus, assetReturnStatus, status, reviewComments } = req.body;
        const validClearance = ['NotStarted', 'InProgress', 'Cleared'];
        const validAsset = ['NotReturned', 'PartiallyReturned', 'Returned'];
        const validStatus = ['Pending', 'Approved', 'Rejected'];
        if (!validClearance.includes(clearanceStatus) ||
            !validAsset.includes(assetReturnStatus) ||
            !validStatus.includes(status)) {
            return res.status(400).json({ message: 'Invalid status, clearance, or asset return status.' });
        }
        const resignation = await Prisma_1.default.resignation.findUnique({ where: { id } });
        if (!resignation) {
            return res.status(404).json({ message: 'Resignation not found.' });
        }
        const updated = await Prisma_1.default.resignation.update({
            where: { id },
            data: {
                clearanceStatus,
                assetReturnStatus,
                status,
                reviewComments: reviewComments || null,
            },
        });
        return res.status(200).json({ message: 'Statuses updated successfully', data: updated });
    }
    catch (err) {
        console.error('Error updating statuses:', err);
        return res.status(500).json({ message: 'Server error while updating status' });
    }
};
exports.updateClearanceStatus = updateClearanceStatus;
// GET MY Resignation
const getMyResignation = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Fetch resignation of the employee linked to this user
        const employee = await Prisma_1.default.employee.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!employee) {
            return res.status(404).json({ message: 'Employee record not found.' });
        }
        const resignation = await Prisma_1.default.resignation.findFirst({
            where: { employeeId: employee.id },
            include: {
                employee: {
                    include: {
                        user: { select: { fullName: true, email: true } },
                    },
                },
                processedBy: {
                    select: { fullName: true, email: true },
                },
            },
        });
        if (!resignation) {
            return res.status(200).json({ message: 'No resignation submitted.' });
        }
        return res.status(200).json({ data: resignation });
    }
    catch (err) {
        console.error('Error fetching resignation:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyResignation = getMyResignation;
