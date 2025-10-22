import { Request, Response } from "express";
import prisma from "../utils/Prisma";
import { getFileUrl } from "./projectController";

export const createTicket = async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            milestone_id,
            assignee_ids,
            deadline,
            estimated_hours,
            actual_hours,
            task_type,
        } = req.body;

        if (!title || !milestone_id) {
            return res.status(400).json({
                success: false,
                message: "Title and milestone_id are required.",
            });
        }

        // ✅ Get milestone + project (with auto_id)
        const milestone = await prisma.milestones.findUnique({
            where: { id: milestone_id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        auto_id: true, // ✅ new field
                    },
                },
            },
        });

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: "Milestone not found.",
            });
        }

        // ✅ Get milestone index within project
        const milestonesInProject = await prisma.milestones.findMany({
            where: { project_id: milestone.project.id },
            orderBy: { created_at: "asc" },
            select: { id: true },
        });
        const milestoneIndex =
            milestonesInProject.findIndex((m) => m.id === milestone.id) + 1;

        // ✅ Count tickets under this milestone
        const ticketCount = await prisma.tickets.count({
            where: { milestone_id },
        });

        // ✅ Build ticket number using project.auto_id
        const projectInitial = milestone.project.name.charAt(0).toUpperCase();
        const milestoneInitial = milestone.name.charAt(0).toUpperCase();

        const ticketNumber = `${projectInitial}${milestone.project.auto_id ?? 0
            }${milestoneInitial}${milestoneIndex}-${String(ticketCount + 1).padStart(
                3,
                "0"
            )}`;

        // ✅ Handle file uploads
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

        const assigneeIds = assignee_ids
            ? assignee_ids.split(",").map((id: string) => id.trim())
            : [];

        // ✅ Create ticket
        const ticket = await prisma.tickets.create({
            data: {
                title,
                description,
                status: status || "in_queue",
                priority,
                milestone_id,
                documents: documentsObj,
                deadline: deadline ? new Date(deadline) : null,
                estimated_hours: Number(estimated_hours),
                actual_hours: Number(actual_hours),
                created_by: req.user?.userId,
                task_type,
                ticket_number: ticketNumber, // ✅ Clean formatted ticket number
                assignees: {
                    connect: assigneeIds.map((id: string) => ({ id })),
                },
            },
            include: {
                assignees: {
                    select: {
                        id: true,
                        designation: true,
                        user: true,
                    },
                },
                milestone: {
                    include: {
                        project: {
                            select: { id: true, name: true, auto_id: true },
                        },
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: "Ticket created successfully.",
            ticket,
        });
    } catch (error: any) {
        console.error("Error creating ticket:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create ticket.",
            error: error.message,
        });
    }
};

export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await prisma.tickets.findMany({
            where: {
                status: { not: "deleted" },
            },
            include: {
                assignees: {
                    select: {
                        id: true,
                        designation: true,
                        user: true,
                    },
                },
                milestone: {
                    include: {
                        project: {
                            select: { id: true, name: true, client_name: true },
                        },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        return res.status(200).json({
            success: true,
            message: "Tickets fetched successfully.",
            tickets,
        });
    } catch (error: any) {
        console.error("Error fetching tickets:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch tickets.",
            error: error.message,
        });
    }
};

export const getTicketById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.tickets.findUnique({
            where: { id },
            include: {
                assignees: {
                    select: {
                        id: true,
                        designation: true,
                        user: true,
                    },
                },
                milestone: {
                    include: {
                        project: {
                            select: { id: true, name: true, client_name: true },
                        },
                    },
                },
            },

        });

        if (!ticket || ticket.status === "deleted") {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ticket fetched successfully.",
            ticket,
        });
    } catch (error: any) {
        console.error("Error fetching ticket:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ticket.",
            error: error.message,
        });
    }
};

export const updateTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            status,
            priority,
            milestone_id,
            assignee_ids,
            deadline,
            estimated_hours,
            actual_hours,
            task_type,
        } = req.body;

        console.log(req.body);

        const existingTicket = await prisma.tickets.findUnique({
            where: { id },
            include: {
                milestone: {
                    include: {
                        project: { select: { id: true, name: true, auto_id: true } },
                    },
                },
            },
        });

        if (!existingTicket || existingTicket.status === "deleted") {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
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

        const assigneeIds = assignee_ids
            ? assignee_ids.split(",").map((id: string) => id.trim())
            : [];

        let closedAt: Date | undefined;
        if (status === "closed") {
            closedAt = new Date();
        }

        const mergedDocuments = [
            ...((existingTicket.documents as any[]) ?? []),
            ...(documentsObj ?? []),
        ];

        const milestoneExists = await prisma.milestones.findUnique({
            where: { id: milestone_id },
        });
        console.log("✅ milestone exists:", !!milestoneExists);

        const assigneeExists = await prisma.employees.findMany({
            where: { id: { in: assigneeIds } },
        });
        console.log("✅ valid assignees:", assigneeExists.map(a => a.id));


        // ✅ Update ticket
        const updatedTicket = await prisma.tickets.update({
            where: { id },
            data: {
                title,
                description,
                status,
                priority,
                milestone_id: milestone_id || existingTicket.milestone_id,
                deadline: deadline ? new Date(deadline) : undefined,
                estimated_hours: Number(estimated_hours),
                actual_hours: Number(actual_hours),
                documents: mergedDocuments, // ✅ always array, never null
                task_type: task_type || existingTicket.task_type,
                updated_by: req.user?.userId,
                closed_at: status === "closed" ? closedAt : undefined,
                assignees: assigneeIds.length
                    ? {
                        set: [], // Clear existing first
                        connect: assigneeIds.map((id: string) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                assignees: {
                    select: {
                        id: true,
                        designation: true,
                        user: true,
                    },
                },
                milestone: {
                    include: {
                        project: {
                            select: { id: true, name: true, auto_id: true },
                        },
                    },
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Ticket updated successfully.",
            ticket: updatedTicket,
        });
    } catch (error: any) {
        console.error("Error updating ticket:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update ticket.",
            error: error.message,
        });
    }
};

export const deleteTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.tickets.findUnique({ where: { id } });

        if (!ticket || ticket.status === "deleted") {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        await prisma.tickets.update({
            where: { id },
            data: {
                status: "deleted",
                updated_by: req.user?.userId,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Ticket deleted successfully (soft delete).",
        });
    } catch (error: any) {
        console.error("Error deleting ticket:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete ticket.",
            error: error.message,
        });
    }
};
