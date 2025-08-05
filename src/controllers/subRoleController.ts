import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
const prisma = new PrismaClient();

const router = express.Router();

// CREATE SubRole
export const createSubRole = async (req: Request, res: Response) => {
    try {
        const { name, description, level, permissionIds } = req.body;

        if (!level) {
            return res.status(400).json({ success: false, message: 'Level is required.' });
        }

        const subRole = await prisma.subRole.create({
            data: {
                name,
                description,
                level,
                permissions: {
                    create: permissionIds?.map((permissionId: string) => ({
                        permission: { connect: { id: permissionId } },
                    })) || [],
                },
            },
        });

        res.status(201).json(subRole);
    } catch (error) {
        console.error('Create SubRole Error:', error);
        res.status(500).json({ error: 'Failed to create SubRole' });
    }
};

// READ all SubRoles
export const getAllSubRoles = async (req: Request, res: Response) => {
    try {
        const subRoles = await prisma.subRole.findMany({
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
        const subRole = await prisma.subRole.findUnique({
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
        const { name, description, permissionIds } = req.body;

        // Update SubRole main fields
        const updated = await prisma.subRole.update({
            where: { id },
            data: {
                name,
                description,
                permissions: {
                    deleteMany: {}, // remove all previous permissions
                    create: permissionIds?.map((permissionId: string) => ({
                        permission: { connect: { id: permissionId } },
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

        await prisma.subRolePermission.deleteMany({ where: { subRoleId: id } });
        await prisma.subRole.delete({ where: { id } });

        res.json({ message: 'SubRole deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete SubRole' });
    }
};

// controllers/permissionController.ts
export const assignPermissionsToSubRole = async (req: Request, res: Response) => {
    try {
        const { subRoleId, permissionIds } = req.body;

        if (!subRoleId || !Array.isArray(permissionIds)) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Step 1: Delete existing SubRolePermissions
            await tx.subRolePermission.deleteMany({ where: { subRoleId } });

            // Step 2: Re-assign new permissions to SubRole
            const data = permissionIds.map((permissionId: string) => ({
                subRoleId,
                permissionId,
            }));
            await tx.subRolePermission.createMany({ data, skipDuplicates: true });

            // Step 3: Get all users with this subRole
            const users = await tx.user.findMany({
                where: { subRoleId },
                select: { id: true },
            });

            const userIds = users.map((u) => u.id);
            if (userIds.length > 0) {
                // Step 4: Delete all UserPermissions for those users
                await tx.userPermission.deleteMany({
                    where: { userId: { in: userIds } },
                });

                // Step 5: Add new permissions to those users
                const userPermissionData = userIds.flatMap((userId) =>
                    permissionIds.map((permissionId: string) => ({
                        userId,
                        permissionId,
                    }))
                );

                await tx.userPermission.createMany({
                    data: userPermissionData,
                    skipDuplicates: true,
                });
            }
        });

        res.status(200).json({ message: 'SubRole and user permissions updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign permissions to SubRole' });
    }
};

