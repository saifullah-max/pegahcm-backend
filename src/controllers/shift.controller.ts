import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { validateShift } from '../utils/validators';

const prisma = new PrismaClient();

export const createShift = async (req: Request, res: Response) => {
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
    const validationError = validateShift(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description
      }
    });

    res.status(201).json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany();
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await prisma.shift.findUnique({
      where: { id }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
};

function convertTimeToDate(timeStr: string): Date {
  const today = new Date();
  const [time, modifier] = timeStr.split(' '); // e.g., "03:00 PM"
  const [hoursStr, minutesStr] = time.split(':');

  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const date = new Date(today);
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
}


export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, description } = req.body;

    const validationError = validateShift(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name,
        startTime: convertTimeToDate(startTime),
        endTime: convertTimeToDate(endTime),
        description,
      },
    });

    res.json(shift);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
};


export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if shift is being used in any attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { shiftId: id }
    });

    if (attendanceRecords.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete shift as it is being used in attendance records'
      });
    }

    await prisma.shift.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
}; 