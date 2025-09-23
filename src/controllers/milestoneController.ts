import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

// Create a new milestone
export const create_milestone = async (req: Request, res: Response) => {
    try {
        const { name, description, due_date, status, project_id } = req.body;

        const newMilestone = await prisma.milestones.create({
            data: {
                name,
                description,
                due_date: new Date(due_date),
                status,
                project: { connect: { id: project_id } },
            },
        });

        res.status(201).json(newMilestone);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get all milestones
export const get_all_milestones = async (req: Request, res: Response) => {
    try {
        const milestones = await prisma.milestones.findMany({
            include: { project: true },
        });
        res.status(200).json(milestones);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single milestone by ID
export const get_milestone_by_id = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const milestone = await prisma.milestones.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        res.status(200).json(milestone);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Update a milestone by ID
export const update_milestone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, due_date, status, project_id } = req.body;

        const updatedMilestone = await prisma.milestones.update({
            where: { id },
            data: {
                name,
                description,
                due_date: due_date ? new Date(due_date) : undefined,
                status,
                project: project_id ? { connect: { id: project_id } } : undefined,
            },
        });

        res.status(200).json(updatedMilestone);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a milestone by ID
export const delete_milestone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.milestones.delete({
            where: { id },
        });
        res.status(204).send(); // No content
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
