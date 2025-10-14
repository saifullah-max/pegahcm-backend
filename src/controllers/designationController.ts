import { Request, Response } from "express";
import prisma from "../utils/Prisma";

// ✅ Create designation
export const createDesignation = async (req: Request, res: Response) => {
    try {
        const { name, description, created_by } = req.body;

        const designation = await prisma.designations.create({
            data: { name, description, created_by },
        });

        res.status(201).json({ success: true, data: designation });
    } catch (error) {
        console.error("Error creating designation:", error);
        res.status(500).json({ success: false, message: "Failed to create designation" });
    }
};

// ✅ Get all designations (excluding soft-deleted)
export const getDesignations = async (req: Request, res: Response) => {
    try {
        const designations = await prisma.designations.findMany({
            where: { deleted_at: null },
            orderBy: { created_at: "desc" },
        });

        res.json({ success: true, data: designations });
    } catch (error) {
        console.error("Error fetching designations:", error);
        res.status(500).json({ success: false, message: "Failed to fetch designations" });
    }
};

// ✅ Get single designation by ID
export const getDesignationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const designation = await prisma.designations.findFirst({
            where: { id, deleted_at: null },
        });

        if (!designation) {
            return res.status(404).json({ success: false, message: "Designation not found" });
        }

        res.json({ success: true, data: designation });
    } catch (error) {
        console.error("Error fetching designation:", error);
        res.status(500).json({ success: false, message: "Failed to fetch designation" });
    }
};

// ✅ Update designation
export const updateDesignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, updated_by } = req.body;

        const designation = await prisma.designations.update({
            where: { id },
            data: { name, description, updated_by },
        });

        res.json({ success: true, data: designation });
    } catch (error) {
        console.error("Error updating designation:", error);
        res.status(500).json({ success: false, message: "Failed to update designation" });
    }
};

// ✅ Soft delete designation
export const deleteDesignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const designation = await prisma.designations.update({
            where: { id },
            data: { deleted_at: new Date() }, // 👈 soft delete
        });

        res.json({ success: true, message: "Designation deleted successfully", data: designation });
    } catch (error) {
        console.error("Error deleting designation:", error);
        res.status(500).json({ success: false, message: "Failed to delete designation" });
    }
};
