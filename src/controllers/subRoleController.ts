import { Request, Response } from 'express';
import { createScopedNotification } from '../utils/notificationUtils';
import prisma from '../utils/Prisma';

// CREATE SubRole
export const createSubRole = async (req: Request, res: Response) => {
    try {
        const { name, description, level, permission_ids } = req.body;

        if (!level) {
            return res.status(400).json({ success: false, message: 'Level is required.' });
        }

        // Check if level > 1 and already exists
        if (level > 1) {
            const existingSubRole = await prisma.sub_roles.findFirst({
                where: { level },
            });

            if (existingSubRole) {
                return res.status(400).json({
                    success: false,
                    message: `A sub-role with level ${level} already exists. Please choose a different level.`,
                });
            }
        }

        const subRole = await prisma.sub_roles.create({
            data: {
                name,
                description,
                level,
                permissions: {
                    create: permission_ids?.map((permission_id: string) => ({
                        permission: { connect: { id: permission_id } },
                    })) || [],
                },
            },
        });

        res.status(201).json({ success: true, subRole });
    } catch (error) {
        console.error('Create SubRole Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create SubRole', error });
    }
};

// READ all SubRoles
export const getAllSubRoles = async (req: Request, res: Response) => {
    try {
        const subRoles = await prisma.sub_roles.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                users: true,
            },
        });
        res.json(subRoles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch SubRoles' });
    }
};

// READ single SubRole by ID
export const getSubRoleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log("Sub-role id:", id);
        const subRole = await prisma.sub_roles.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        if (!subRole) return res.status(404).json({ error: 'SubRole not found' });

        res.json(subRole);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch SubRole' });
    }
};

// UPDATE SubRole
export const updateSubRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, permission_ids } = req.body;

        // Update SubRole main fields
        const updated = await prisma.sub_roles.update({
            where: { id },
            data: {
                name,
                description,
                permissions: {
                    deleteMany: {}, // remove all previous permissions
                    create: permission_ids?.map((permission_id: string) => ({
                        permission: { connect: { id: permission_id } },
                    })) || [],
                },
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Update SubRole Error:', error);
        res.status(500).json({ error: 'Failed to update SubRole' });
    }
};

// DELETE SubRole
export const deleteSubRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.sub_role_permissions.deleteMany({ where: { sub_role_id: id } });
        await prisma.sub_roles.delete({ where: { id } });

        res.json({ message: 'SubRole deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete SubRole' });
    }
};