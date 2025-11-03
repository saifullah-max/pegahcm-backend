import { Request, Response } from "express";
import prisma from "../utils/Prisma";
import { getFileUrl } from "./projectController";
import { getIO } from "../utils/socket";

console.log("💡 Using updated createTicketComment controller file");


export const createTicketComment = async (req: Request, res: Response) => {
    console.log("🔥 createTicketComment() hit");
    try {
        const io = getIO();

        const { ticket_id, description, parent_id } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!ticket_id || !description)
            return res.status(400).json({ message: "Ticket ID and description are required" });

        // --- Fetch employee ---
        const employee = await prisma.employees.findUnique({
            where: { user_id: userId },
        });
        if (!employee) return res.status(403).json({ message: "No employee profile found for this user" });

        // --- Validate ticket ---
        const ticket = await prisma.tickets.findUnique({ where: { id: ticket_id } });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // --- Prepare uploaded documents ---
        const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };
        const documentsObj =
            files.documents?.map((file) => ({
                name: file.originalname,
                url: getFileUrl(req, "documents", file.filename),
                mime_type: file.mimetype,
                type: file.mimetype,
                uploaded_at: new Date(),
            })) || [];


        console.log("✅ Passed validation", { ticket_id, userId, parent_id });

        // --- Create new comment ---
        const newComment = await prisma.ticket_comments.create({
            data: {
                ticket_id,
                employee_id: employee.id,
                description,
                documents: documentsObj,
                parent_id: parent_id || null,
                created_by: userId,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        user: { select: { full_name: true } },
                        profile_image_url: true,
                    },
                },
            },
        });

        // --- Emit proper event ---
        if (parent_id) {
            // ✅ This is a reply → emit reply event
            io.to(ticket_id).emit("reply_comment", {
                parentId: parent_id,
                reply: newComment,
            });
        } else {
            // ✅ This is a fresh comment → emit new_comment
            console.log("🎯 Emitting new_comment to:", ticket_id);
            console.log("Rooms available:", Array.from(io.sockets.adapter.rooms.keys()));

            io.to(ticket_id).emit("new_comment", newComment);
        }

        return res.status(201).json({
            message: "Comment added successfully",
            data: newComment,
        });
    } catch (error) {
        console.error("Create Ticket Comment Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: (error as Error).message,
        });
    }
};

export const getCommentsByTicketId = async (req: Request, res: Response) => {
    try {
        const { ticketId } = req.params;

        if (!ticketId) {
            return res.status(400).json({ message: "Ticket ID is required" });
        }

        const comments = await prisma.ticket_comments.findMany({
            where: {
                ticket_id: ticketId,
                parent_id: null, // only top-level comments first
                deleted_at: null,
                status: 'active'
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                full_name: true
                            },
                        },
                        profile_image_url: true,
                    },
                },
                replies: {
                    where: { deleted_at: null },
                    include: {
                        employee: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        full_name: true
                                    },
                                },
                                profile_image_url: true,
                            },
                        },
                    },
                    orderBy: {
                        created_at: "asc",
                    },
                },
            },
            orderBy: {
                created_at: "asc",
            },
        });

        return res.status(200).json({
            success: true,
            message: "Comments retrieved successfully",
            data: comments,
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const DeleteCommentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted_by = req.user?.userId || "admin";

        // Check if comment exists
        const comment = await prisma.ticket_comments.findUnique({
            where: { id },
            include: { replies: true },
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Use transaction for safe cascade soft delete
        await prisma.$transaction([
            // Soft delete parent comment
            prisma.ticket_comments.update({
                where: { id },
                data: {
                    status: "deleted",
                    deleted_at: new Date(),
                    deleted_by,
                },
            }),

            // Soft delete all replies
            prisma.ticket_comments.updateMany({
                where: { parent_id: id },
                data: {
                    status: "deleted",
                    deleted_at: new Date(),
                    deleted_by,
                },
            }),
        ]);

        return res.status(200).json({ message: "Comment deleted successfully (soft delete)" });
    } catch (error) {
        console.error("❌ Error deleting comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};