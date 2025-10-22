import { Request, Response } from 'express';
import prisma from '../utils/Prisma';
import { getFileUrl } from './projectController';

// Create a new milestone
export const create_milestone = async (req: Request, res: Response) => {
    try {
        const { name, project_id, deadline, estimated_hours, actual_hours, status, assignee, revenue, description } = req.body;

        const project = await prisma.projects.findUnique({
            where: { id: project_id },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Provided Project not found in database",
            });
        }

        const files = (req.files || {}) as {
            [fieldname: string]: Express.Multer.File[];
        };

        const documentsObj =
            files.documents?.map((file) => ({
                name: file.originalname,
                url: getFileUrl(req, "documents", file.filename),
                mime_type: file.mimetype,
                type: file.mimetype,
                uploaded_at: new Date(),
            })) || [];

        const assigneeIds = assignee
            ? assignee.split(",").map((id: string) => id.trim())
            : [];

        const newMilestone = await prisma.milestones.create({
            data: {
                name,
                project: {
                    connect: { id: project.id },
                },
                deadline: new Date(deadline),
                estimated_hours: Number(estimated_hours),
                actual_hours: Number(actual_hours),
                status,
                assignees: {
                    connect: assigneeIds.map((id: string) => ({ id })),
                },
                revenue: Number(revenue),
                description,
                documents: documentsObj,
                created_by: req.user?.userId,
            },
            include: { assignees: true },
        });

        if (project.status === "completed") {
            await prisma.projects.update({
                where: { id: project.id },
                data: { status: "In progress" },
            });
        }
        
        
        res.status(201).json(newMilestone);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get all milestones
export const get_all_milestones = async (req: Request, res: Response) => {
    try {
        const milestones = await prisma.milestones.findMany({
            include: {
                project: {
                    include: {
                        sales_persons: {
                            include: {
                                user: true
                            }
                        },
                        assignees: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                assignees: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { created_at: "desc" }

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
            include: {
                project: {
                    include: {
                        sales_persons: {
                            include: {
                                user: true
                            }
                        },
                        assignees: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                assignees: {
                    include: {
                        user: true
                    }
                }
            },
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
        const { name, project_id, deadline, estimated_hours, actual_hours, status, assignee, revenue, description } = req.body;

        const project = await prisma.projects.findUnique({
            where: { id: project_id }
        });

        if (!project) {
            return res.status(404).json({ success: false, message: "Provided Project doesnot found in database" });
        }

        const files = (req.files || {}) as {
            [fieldname: string]: Express.Multer.File[];
        };

        const documentsObj =
            files.documents?.map((file) => ({
                name: file.originalname,
                url: getFileUrl(req, "documents", file.filename),
                mime_type: file.mimetype,
                type: file.mimetype,
                uploaded_at: new Date(),
            })) || [];

        const assigneeIds = assignee
            ? assignee.split(",").map((id: string) => id.trim())
            : [];

        const updatedMilestone = await prisma.milestones.update({
            where: { id },
            data: {
                name: name ? name : undefined,
                project_id: project_id ? project_id : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                estimated_hours: estimated_hours ? Number(estimated_hours) : undefined,
                actual_hours: actual_hours ? Number(actual_hours) : undefined,
                status: status ? status : undefined,
                assignees: {
                    set: [], // clears old ones
                    connect: assigneeIds.map((id: string) => ({ id })), // adds new ones
                }, // assuming FK
                revenue: revenue ? Number(revenue) : undefined,
                description: description ? description : undefined,
                documents: documentsObj.length > 0 ? documentsObj : undefined,
                updated_by: req.user?.userId,
            },
            include: { assignees: true },

        });

        const projectId = await updatedMilestone.project_id

        const allMilestones = await prisma.milestones.findMany({
            where: { project_id: projectId },
            select: { status: true },
        });

        const allCompleted = allMilestones.length > 0 && allMilestones.every(m => m.status === "completed");

        if (allCompleted) {
            await prisma.projects.update({
                where: { id: projectId },
                data: { status: "completed" },
            });
        } else {
            await prisma.projects.update({
                where: { id: projectId },
                data: { status: "active" },
            });
        }

        res.status(200).json(updatedMilestone);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a milestone by ID
export const delete_milestone = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const milestone = await prisma.milestones.update({
            where: { id },
            data: {
                status: 'deleted'
            }
        });
        res.status(200).json({ success: true, message: "Milestone deleted successfully", milestone });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
