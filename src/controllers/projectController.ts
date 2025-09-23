import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

// Create a new project
export const create_project = async (req: Request, res: Response) => {
    try {
        const { name, description, start_date, end_date, status, bid_id } = req.body;

        const newProject = await prisma.projects.create({
            data: {
                name,
                description,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : undefined,
                status,
                bid: bid_id ? { connect: { id: bid_id } } : undefined,
            },
        });

        res.status(201).json(newProject);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get all projects
export const get_all_projects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.projects.findMany({
            include: { bid: true, milestones: true },
        });
        res.status(200).json(projects);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single project by ID
export const get_project_by_id = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.projects.findUnique({
            where: { id },
            include: { bid: true, milestones: true },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Update a project by ID
export const update_project = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, start_date, end_date, status, bid_id } = req.body;

        const updatedProject = await prisma.projects.update({
            where: { id },
            data: {
                name,
                description,
                start_date: start_date ? new Date(start_date) : undefined,
                end_date: end_date ? new Date(end_date) : undefined,
                status,
                bid: bid_id ? { connect: { id: bid_id } } : undefined,
            },
        });

        res.status(200).json(updatedProject);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a project by ID
export const delete_project = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.projects.delete({
            where: { id },
        });
        res.status(204).send(); // No content
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
