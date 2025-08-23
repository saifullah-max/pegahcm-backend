"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShift = exports.updateShift = exports.getShiftById = exports.getAllShifts = exports.createShift = void 0;
const client_1 = require("@prisma/client");
const validators_1 = require("../utils/validators");
const Prisma_1 = __importDefault(require("../utils/Prisma"));
const createShift = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is required' });
        }
        const { name, startTime, endTime, description } = req.body;
        if (!name || !startTime || !endTime) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'startTime', 'endTime'],
                received: { name, startTime, endTime, description }
            });
        }
        // Validate shift data
        const validationError = (0, validators_1.validateShift)(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }
        const shift = await Prisma_1.default.shift.create({
            data: {
                name,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                description
            }
        });
        res.status(201).json(shift);
    }
    catch (error) {
        console.error('Error creating shift:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(400).json({
                    error: 'A shift with this name already exists',
                    field: error.meta?.target
                });
            }
        }
        res.status(500).json({
            error: 'Failed to create shift',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createShift = createShift;
const getAllShifts = async (req, res) => {
    try {
        const shifts = await Prisma_1.default.shift.findMany();
        res.json(shifts);
    }
    catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Failed to fetch shifts' });
    }
};
exports.getAllShifts = getAllShifts;
const getShiftById = async (req, res) => {
    try {
        const { id } = req.params;
        const shift = await Prisma_1.default.shift.findUnique({
            where: { id }
        });
        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }
        res.json(shift);
    }
    catch (error) {
        console.error('Error fetching shift:', error);
        res.status(500).json({ error: 'Failed to fetch shift' });
    }
};
exports.getShiftById = getShiftById;
function convertTimeToDate(timeStr) {
    const today = new Date();
    const [time, modifier] = timeStr.split(' '); // e.g., "03:00 PM"
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (modifier === 'PM' && hours !== 12)
        hours += 12;
    if (modifier === 'AM' && hours === 12)
        hours = 0;
    const date = new Date(today);
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}
const updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime, description } = req.body;
        const validationError = (0, validators_1.validateShift)(req.body);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }
        const shift = await Prisma_1.default.shift.update({
            where: { id },
            data: {
                name,
                startTime: convertTimeToDate(startTime),
                endTime: convertTimeToDate(endTime),
                description,
            },
        });
        res.json(shift);
    }
    catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ error: 'Failed to update shift' });
    }
};
exports.updateShift = updateShift;
const deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if shift is being used in any attendance records
        const attendanceRecords = await Prisma_1.default.attendanceRecord.findMany({
            where: { shiftId: id }
        });
        if (attendanceRecords.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete shift as it is being used in attendance records'
            });
        }
        await Prisma_1.default.shift.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ error: 'Failed to delete shift' });
    }
};
exports.deleteShift = deleteShift;
