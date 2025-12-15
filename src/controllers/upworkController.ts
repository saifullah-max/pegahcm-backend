import { Request, Response } from 'express';
import prisma from '../utils/Prisma';


export const create_upwork_id = async (req: Request, res: Response) => {
    try {
        const { name, link } = req.body;

        const exisitngId = await prisma.upwork_ids.findUnique({ where: { link } });

        if (exisitngId) {
            return res.status(400).json({ success: false, message: "An Id with the provided data already exists" })
        } else {
            const upwork_id = await prisma.upwork_ids.create({
                data: {
                    name,
                    link,
                    created_by: req.user?.userId
                }
            })
            return res.status(200).json({ success: true, message: "Upwork ID created successfully", upwork_id })
        }
    } catch (error) {
        console.error("Error creating Upwork ID:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
}

export const update_upwork_id = async (req: Request, res: Response) => {
    try {
        const { name, link } = req.body;
        const { id } = req.params;

        const existingId = await prisma.upwork_ids.findUnique({
            where: { id },
        });

        if (!existingId) {
            return res.status(404).json({
                success: false,
                message: "No Upwork ID exists with the provided ID",
            });
        }

        const updated_upwork_data = await prisma.upwork_ids.update({
            where: { id },
            data: {
                name: name ?? existingId.name,
                link: link ?? existingId.link,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Upwork ID updated successfully",
            updated_upwork_data,
        });
    } catch (error) {
        console.error("Failed to update upwork id", error);
        return res
            .status(500)
            .json({ success: false, message: "Server error while updating upwork id" });
    }
};

export const get_all_upwork_ids = async (req: Request, res: Response) => {
    try {
        const current_user_id = req.user?.userId;
        const permissionScope = (req as any).permissionScope || "all"; // 'own' | 'all'

        let where: any = {};
        if (permissionScope === "own") {
            where = {
                OR: [{ created_by: current_user_id }],
            };
        }

        const upwork_ids = await prisma.upwork_ids.findMany({ where });
        return res.status(200).json({ message: true, upwork_ids });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const get_upwork_by_id = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing_id = await prisma.upwork_ids.findUnique({
            where: { id }
        })

        if (!existing_id) {
            return res.status(400).json({ success: false, message: "Failed to find upwork id" })
        } else {
            return res.status(200).json({ success: true, existing_id })
        }
    } catch (error) {

    }
}

export const delete_upwork_id = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const exisitng_id = await prisma.upwork_ids.findUnique({
            where: { id }
        })

        if (!exisitng_id) {
            return res.status(400).json({ success: false, message: "Failed to find the upwrok id" })
        } else {
            const delete_upwork_id = await prisma.upwork_ids.update({
                where: { id },
                data: {
                    status: 'deleted',
                    deleted_at: new Date(),
                    updated_by: req.user?.userId
                }
            })

            return res.status(200).json({ success: true, message: "Id Deleted successfully", update_upwork_id})
        }
    } catch (error) {
        console.error("Failed to delete Id:", error)
        return res.status(500).json({ success: false, message: "Server failed while deleting upwork ID" })
    }
}