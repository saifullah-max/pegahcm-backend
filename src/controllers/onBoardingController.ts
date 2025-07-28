import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createOnboarding = async (req: Request, res: Response) => {
    try {
        const { employeeId, assignedHRId, startDate, notes, status } = req.body;

        if (!employeeId || !assignedHRId || !startDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const onboarding = await prisma.onboardingProcess.create({
            data: {
                employeeId,
                assignedHRId,
                startDate: new Date(startDate),
                notes,
                status: status || 'Pending',
            },
        });

        return res.status(201).json(onboarding);
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('Prisma error code:', error.code);
            return res.status(500).json({ message: `Database error: ${error.code}` });
        }

        console.error('Error creating onboarding:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllHREmployees = async (req: Request, res: Response) => {
    try {
        const hrEmployees = await prisma.employee.findMany({
            where: {
                user: {
                    role: {
                        name: {
                            equals: 'hr', // Case-sensitive match
                        },
                    },
                },
            },
            include: {
                user: {
                    select: {
                        fullName: true,
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
                subDepartment: true,
            },
        });

        if (!hrEmployees || hrEmployees.length === 0) {
            console.warn('[getAllHREmployees] No HR employees found.');
        } else {
            console.log('[getAllHREmployees] Found HR Employees:', hrEmployees.length);
        }

        // ✅ SEND response
        return res.status(200).json(hrEmployees);
    } catch (error) {
        console.error('[getAllHREmployees] Error fetching HR employees:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllOnboardings = async (req: Request, res: Response) => {
    try {
        // ✅ FIXED: getAllOnboardings
        const onboardings = await prisma.onboardingProcess.findMany({
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                assignedHR: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                startDate: 'desc',
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

        const onboarding = await prisma.onboardingProcess.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                assignedHR: {
                    select: {
                        id: true,
                        fullName: true,
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
        const { employeeId, assignedHRId, startDate, notes, status } = req.body;

        const updated = await prisma.onboardingProcess.update({
            where: { id },
            data: {
                employeeId,
                assignedHRId,
                startDate: new Date(startDate),
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

        await prisma.onboardingProcess.delete({
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
        const onboardedEmployeeIds = await prisma.onboardingProcess.findMany({
            select: { employeeId: true },
        });

        const onboardedIds = onboardedEmployeeIds.map(e => e.employeeId);

        const employees = await prisma.employee.findMany({
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