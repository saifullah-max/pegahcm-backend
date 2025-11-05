import { Request, Response } from "express";
import prisma from "../utils/Prisma";
import { getFileUrl } from "./projectController";
import { buildFilters } from "../utils/buildFilters";
import { CustomJwtPayload } from "./notificationController";

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


        const milestone = await prisma.milestones.findUnique({
            where: { id: milestone_id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        auto_id: true,
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

        const milestonesInProject = await prisma.milestones.findMany({
            where: { project_id: milestone.project.id },
            orderBy: { created_at: "asc" },
            select: { id: true },
        });
        // const milestoneIndex =
        //     milestonesInProject.findIndex((m) => m.id === milestone.id) + 1;

        const ticketCount = await prisma.tickets.count({
            where: { milestone_id },
        });

        // ✅ Build ticket number using project.auto_id
        // const projectInitial = milestone.project.name.charAt(0).toUpperCase();
        // const milestoneInitial = milestone.name.charAt(0).toUpperCase();

        const ticketNumber = `P${milestone.project.auto_id ?? 1
        }M${milestone.auto_id ?? 1
        }-${String(ticketCount + 1).padStart(
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
        const current_user_id = (req.user as unknown as CustomJwtPayload).userId;
        const permissionScope = (req as any).permissionScope || "all"; // 'own' | 'all'
        const baseWhere = (buildFilters("tickets", req.query) || {}) as any;

        let where: any = baseWhere;
        if (permissionScope === "own") {
            const ownerFilter = {
                OR: [{ created_by: current_user_id }],
            };
            if (Object.keys(baseWhere).length === 0) {
                where = ownerFilter;
            } else {
                where = { AND: [baseWhere, ownerFilter] };
            }
        }

        const tickets = await prisma.tickets.findMany({
            where: {
                AND: [
                    { status: { not: "deleted" } },
                    where
                ]
            },
            include: {
                assignees: {
                    select: {
                        id: true,
                        designation: true,
                        user: true,
                        profile_image_url: true
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
                        user: {
                            select: { id: true, full_name: true, email: true },
                        },
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

        // 🔹 Fetch creator & updater user details (optional)
        const [createdByUser, updatedByUser] = await Promise.all([
            ticket.created_by
                ? prisma.users.findUnique({
                    where: { id: ticket.created_by },
                    select: { id: true, full_name: true },
                })
                : null,
            ticket.updated_by
                ? prisma.users.findUnique({
                    where: { id: ticket.updated_by },
                    select: { id: true, full_name: true },
                })
                : null,
        ]);

        // 🔹 Append readable names to ticket object
        const enrichedTicket = {
            ...ticket,
            created_by_name: createdByUser?.full_name || null,
            updated_by_name: updatedByUser?.full_name || null,
        };

        return res.status(200).json({
            success: true,
            message: "Ticket fetched successfully.",
            ticket: enrichedTicket,
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

        console.log("[UPDATE] Request body:", req.body);

        // ✅ 1. Validate existing ticket
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

        // ✅ 2. Parse kept existing documents if provided
        let keptExistingDocs: any[] | undefined;
        if (req.body.existing_documents !== undefined) {
            try {
                keptExistingDocs = Array.isArray(req.body.existing_documents)
                    ? JSON.parse(req.body.existing_documents[0] || "[]")
                    : JSON.parse(req.body.existing_documents || "[]");
            } catch (e) {
                console.warn("❌ Failed to parse existing_documents JSON");
                keptExistingDocs = [];
            }
        }

        // ✅ 3. Attach newly uploaded documents if any exist
        const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };
        const documentsObj =
            files.documents?.map((file) => ({
                name: file.originalname,
                url: getFileUrl(req, "documents", file.filename),
                mime_type: file.mimetype,
                type: file.mimetype,
                uploaded_at: new Date(),
            })) || [];

        // ✅ 4. Final documents logic
        let finalDocuments: any[] = [];

        if (keptExistingDocs !== undefined) {
            // ✅ UI explicitly updated docs (can be empty or partial)
            finalDocuments = [...keptExistingDocs, ...documentsObj];
        } else {
            // ✅ UI did not touch docs so keep all DB docs
            finalDocuments = [...(existingTicket.documents as any[]), ...documentsObj];
        }

        // ✅ 5. Assignees validation
        const assigneeIds = assignee_ids
            ? assignee_ids.split(",").map((id: string) => id.trim())
            : [];

        const validAssignees = await prisma.employees.findMany({
            where: { id: { in: assigneeIds } },
            select: { id: true },
        });

        const assigneeConnect =
            validAssignees.length > 0
                ? {
                    set: [],
                    connect: validAssignees.map((a) => ({ id: a.id })),
                }
                : undefined;

        // ✅ 6. Validate milestone if provided
        let validMilestoneId = existingTicket.milestone_id;
        if (milestone_id) {
            const milestoneExists = await prisma.milestones.findUnique({
                where: { id: milestone_id },
            });

            if (milestoneExists) validMilestoneId = milestone_id;
        }

        // ✅ 7. Closed timestamp logic
        const closedAt = status === "closed" ? new Date() : undefined;

        // ✅ 8. Update Ticket
        const updatedTicket = await prisma.tickets.update({
            where: { id },
            data: {
                title,
                description,
                status,
                priority,
                milestone_id: validMilestoneId,
                deadline: deadline ? new Date(deadline) : undefined,
                estimated_hours: Number(estimated_hours),
                actual_hours: Number(actual_hours),
                task_type: task_type || existingTicket.task_type,
                documents: finalDocuments,
                updated_by: req.user?.userId,
                closed_at: closedAt,
                ...(assigneeConnect && { assignees: assigneeConnect }),
            },
            include: {
                assignees: {
                    select: { id: true, designation: true, user: true },
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
        console.error("❌ Error updating ticket:", error);
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
