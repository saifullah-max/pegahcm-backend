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

// controllers/permissionController.ts
export const assignPermissionsToSubRole = async (req: Request, res: Response) => {
    try {
        const { sub_role_id, permission_ids } = req.body;
        const performed_by_user_id = req.user?.userId;
        const performed_by_name = req.user?.username || 'Admin';

        if (!sub_role_id || !Array.isArray(permission_ids)) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Step 1: Delete existing SubRolePermissions
            await tx.sub_role_permissions.deleteMany({ where: { sub_role_id } });

            // Step 2: Re-assign new permissions to SubRole
            const data = permission_ids.map((permission_id: string) => ({
                sub_role_id,
                permission_id,
            }));
            await tx.sub_role_permissions.createMany({ data, skipDuplicates: true });

            // Step 3: Get all users with this subRole
            const users = await tx.users.findMany({
                where: { sub_role_id },
                select: { id: true },
            });

            const userIds = users.map((u) => u.id);
            if (userIds.length > 0) {
                // Step 4: Delete all UserPermissions for those users
                await tx.user_permissions.deleteMany({
                    where: { user_id: { in: userIds } },
                });

                // Step 5: Add new permissions to those users
                const userPermissionData = userIds.flatMap((user_id) =>
                    permission_ids.map((permission_id: string) => ({
                        user_id,
                        permission_id,
                    }))
                );

                await tx.user_permissions.createMany({
                    data: userPermissionData,
                    skipDuplicates: true,
                });
            }
        });

        const subRoleName = await prisma.sub_role_permissions.findFirst({
            where: { sub_role_id },
            include: {
                sub_role: true,  // includes all scalar fields of subRole, including 'name'
            },
        });


        // 🔔 Notify all users with that subRole
        const targetUsers = await prisma.users.findMany({
            where: {
                sub_role_id,
                status: 'ACTIVE',
            },
            select: { id: true },
        });


        try {
            const notifyUserPromises = targetUsers.map(user =>
                createScopedNotification({
                    scope: 'ASSIGNED_USER',
                    target_ids: { user_id: user.id },
                    data: {
                        title: 'Role Permissions Updated',
                        message: `Permissions for your role have been updated by ${performed_by_name}.`,
                        type: 'INFO',
                    },
                    visibilityLevel: 3,
                    showPopup: true,
                    excludeUserId: performed_by_user_id, // Don't notify admin again
                })
            );

            // 🔔 Notify admin who updated
            if (performed_by_user_id) {
                notifyUserPromises.push(
                    createScopedNotification({
                        scope: 'ASSIGNED_USER',
                        target_ids: { user_id: performed_by_user_id },
                        data: {
                            title: 'Sub-role Permissions Updated',
                            message: `You successfully updated permissions for ${subRoleName?.sub_role.name} sub-role users.`,
                            type: 'INFO',
                        },
                        visibilityLevel: 0,
                        showPopup: true,
                    })
                );
            }
            await Promise.all(notifyUserPromises);
        } catch (error) {
            console.error("Failed to notify subroles as their permissions updated: ", error)
        }

        res.status(200).json({ message: 'SubRole and user permissions updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign permissions to SubRole' });
    }
};