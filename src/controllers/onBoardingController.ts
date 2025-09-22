import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/Prisma';

export const createOnboarding = async (req: Request, res: Response) => {
    try {
        const { employee_id, assigned_hr_id, start_date, notes, status } = req.body;

        if (!employee_id || !assigned_hr_id || !start_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // ✅ Check for existing onboarding
        const existing = await prisma.onboarding_processes.findUnique({
            where: {
                id: employee_id as string,
            },
        });

        if (existing) {
            return res.status(400).json({ message: 'This employee is already assigned to an onboarding process.' });
        }

        const onboarding = await prisma.onboarding_processes.create({
            data: {
                employee_id,
                assigned_hr_id,
                start_date: new Date(start_date),
                notes,
                status: status || 'Pending',
            },
        });

        return res.status(201).json(onboarding);
    } catch (error: any) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002' &&
            Array.isArray(error.meta?.target) &&
            error.meta.target.includes('employee_id')
        ) {
            return res.status(400).json({ message: 'This employee is already onboarded.' });
        }

        console.error('Error creating onboarding:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllHREmployees = async (req: Request, res: Response) => {
    try {
        const hrEmployees = await prisma.employees.findMany({
            where: {
                user: {
                    role_tag: {
                        equals: 'HR'
                    },
                },
            },
            include: {
                user: {
                    select: {
                        full_name: true,
                        email: true,
                        username: true,
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                department: true,
                sub_department: true,
            },
        });

        console.log(`[getAllHREmployees] Found ${hrEmployees.length} HR employees`);
        return res.status(200).json(hrEmployees);
    } catch (error) {
        console.error('[getAllHREmployees] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllOnboardings = async (req: Request, res: Response) => {
    try {
        // ✅ FIXED: getAllOnboardings
        const onboardings = await prisma.onboarding_processes.findMany({
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                assigned_hr: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                start_date: 'desc',
            },
        });


        return res.status(200).json(onboardings);
    } catch (error) {
        console.error('[getAllOnboardings] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getOnboardingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const onboarding = await prisma.onboarding_processes.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                assigned_hr: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        username: true,
                    },
                },
            },
        });


        if (!onboarding) {
            return res.status(404).json({ message: 'Onboarding not found' });
        }

        return res.status(200).json(onboarding);
    } catch (error) {
        console.error('[getOnboardingById] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateOnboarding = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { employee_id, assigned_hr_id, start_date, notes, status } = req.body;

        const updated = await prisma.onboarding_processes.update({
            where: { id },
            data: {
                employee_id,
                assigned_hr_id,
                start_date: new Date(start_date),
                notes,
                status,
            },
        });

        return res.status(200).json(updated);
    } catch (error) {
        console.error('[updateOnboarding] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteOnboarding = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.onboarding_processes.delete({
            where: { id },
        });

        return res.status(204).send();
    } catch (error) {
        console.error('[deleteOnboarding] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getNotOnboardedEmployees = async (req: Request, res: Response) => {
    try {
        const onboarded_employee_ids = await prisma.onboarding_processes.findMany({
            select: { employee_id: true },
        });

        const onboardedIds = onboarded_employee_ids.map(e => e.employee_id);

        const employees = await prisma.employees.findMany({
            where: {
                id: { notIn: onboardedIds },
            },
            include: { user: true },
        });

        return res.status(200).json(employees);
    } catch (error) {
        console.error('[getNotOnboardedEmployees] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};