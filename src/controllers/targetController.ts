import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

// Create a new target
export const create_target = async (req: Request, res: Response) => {
    try {
        const { opening_target, closing_target, daily_bids, employee_id } = req.body;

        let employeeData = {};

        const user_id = req.user?.userId


        if (employee_id) {
            const employee = await prisma.employees.findUnique({
                where: { id: employee_id },
                include: {
                    department: true,
                },
            });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const keywords = ["sales", "upwork", "freelance", "marketing", "business", "bidding"];

            const deptName = employee.department?.name?.toLowerCase() || "";

            // Create an array that includes both singular and plural versions
            const allKeywords = [...keywords, ...keywords.map(k => k + "s")];

            if (!allKeywords.some(word => deptName.includes(word))) {
                return res.status(400).json({ error: 'Employee does not belong to a Sales-related department' });
            }
            employeeData = { connect: { id: employee_id } };
        } else {
            return res.status(404).json({ error: "No Employee Id Found" })
        }

        const newTarget = await prisma.target.create({
            data: {
                opening_target: parseInt(opening_target),
                closing_target: parseInt(closing_target),
                daily_bids: parseInt(daily_bids),
                employee: employeeData,
                created_by: user_id
            },
        });

        res.status(201).json(newTarget);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get all targets
export const get_all_targets = async (req: Request, res: Response) => {
    try {
        const targets = await prisma.target.findMany({
            include: { employee: { include: { department: true } } },
        });
        res.status(200).json(targets);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single target by ID
export const get_target_by_id = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const target = await prisma.target.findUnique({
            where: { id },
            include: { employee: { include: { department: true } } },
        });
        console.log("Target:", target);

        if (!target) {
            return res.status(404).json({ error: 'Target not found' });
        }

        res.status(200).json(target);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Update a target by ID
export const update_target = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { opening_target, closing_target, daily_bids, employee_id } = req.body;

        let employeeData = {};

        if (employee_id) {
            const employee = await prisma.employees.findUnique({
                where: { id: employee_id },
                include: {
                    department: true,
                },
            });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const keywords = ["sales", "upwork", "freelance", "marketing", "business", "bidding"];

            const deptName = employee.department?.name?.toLowerCase() || "";

            // Create an array that includes both singular and plural versions
            const allKeywords = [...keywords, ...keywords.map(k => k + "s")];

            if (!allKeywords.some(word => deptName.includes(word))) {
                return res.status(400).json({ error: 'Employee does not belong to a Sales-related department' });
            }

            employeeData = { connect: { id: employee_id } };
        } else if (employee_id === null) {
            employeeData = { disconnect: true };
        }

        const updatedTarget = await prisma.target.update({
            where: { id },
            data: {
                opening_target: opening_target ? parseInt(opening_target) : undefined,
                closing_target: closing_target ? parseInt(closing_target) : undefined,
                daily_bids: daily_bids ? parseInt(daily_bids) : undefined,
                employee: Object.keys(employeeData).length > 0 ? employeeData : undefined,
                updated_by: employee_id
            },
        });

        res.status(200).json(updatedTarget);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a target by ID
export const delete_target = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.target.delete({
            where: { id },
        });
        res.status(204).send(); // No content
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
