import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { validateShift } from '../utils/validators';
import prisma from '../utils/Prisma';

export const createShift = async (req: Request, res: Response) => {
  try {

    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, start_time, end_time, description } = req.body;

    if (!name || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'start_time', 'end_time'],
        received: { name, start_time, end_time, description }
      });
    }

    // Validate shift data
    const validationError = validateShift(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const shift = await prisma.shifts.create({
      data: {
        name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
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
    const shifts = await prisma.shifts.findMany();
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await prisma.shifts.findUnique({
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

function convertTimeToDate(date_time_str: string): Date {
  // Example input: "2025-09-03 10:00 PM"
  const [datePart, timePart, modifier] = date_time_str.split(/[\s]+/);
  const [year, month, day] = datePart.split('-').map(Number);
  const [hoursStr, minutesStr] = timePart.split(':');

  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, start_time, end_time, description } = req.body;

    const validationError = validateShift(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const shift = await prisma.shifts.update({
      where: { id },
      data: {
        name,
        start_time: convertTimeToDate(start_time),
        end_time: convertTimeToDate(end_time),
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
    const attendanceRecords = await prisma.attendanceRecords.findMany({
      where: { shift_id: id }
    });

    if (attendanceRecords.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete shift as it is being used in attendance records'
      });
    }

    await prisma.shifts.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
}; 