import { Request, Response } from "express";
import prisma from "../utils/Prisma";

export const createTicketComment = async (req: Request, res: Response) => {
    try {
        const { ticket_id, description, parent_id, documents } = req.body;
        const userId = req.user?.userId; // from auth middleware

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!ticket_id || !description) {
            return res.status(400).json({ message: "Ticket ID and description are required" });
        }

        // ✅ Get employee ID from logged-in user
        const employee = await prisma.employees.findUnique({
            where: { user_id: userId },
        });

        if (!employee) {
            return res.status(403).json({ message: "No employee profile found for this user" });
        }

        // ✅ Ensure ticket exists
        const ticket = await prisma.tickets.findUnique({
            where: { id: ticket_id },
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // ✅ If reply comment: validate parent
        if (parent_id) {
            const parentComment = await prisma.ticket_comments.findUnique({
                where: { id: parent_id },
            });
            if (!parentComment) {
                return res.status(404).json({ message: "Parent comment not found" });
            }
        }

        // ✅ Create comment
        const newComment = await prisma.ticket_comments.create({
            data: {
                ticket_id,
                employee_id: employee.id,
                description,
                documents,
                parent_id: parent_id || null,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        user: {
                            select: { full_name: true },
                        },
                        profile_image_url: true
                    },
                },
            },
        });

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