"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignPermissionsToSubRole = exports.deleteSubRole = exports.updateSubRole = exports.getSubRoleById = exports.getAllSubRoles = exports.createSubRole = void 0;
const notificationUtils_1 = require("../utils/notificationUtils");
const Prisma_1 = __importDefault(require("../utils/Prisma"));
// CREATE SubRole
const createSubRole = async (req, res) => {
    try {
        const { name, description, level, permissionIds } = req.body;
        if (!level) {
            return res.status(400).json({ success: false, message: 'Level is required.' });
        }
        // Check if level > 1 and already exists
        if (level > 1) {
            const existingSubRole = await Prisma_1.default.subRole.findFirst({
                where: { level },
            });
            if (existingSubRole) {
                return res.status(400).json({
                    success: false,
                    message: `A sub-role with level ${level} already exists. Please choose a different level.`,
                });
            }
        }
        const subRole = await Prisma_1.default.subRole.create({
            data: {
                name,
                description,
                level,
                permissions: {
                    create: permissionIds?.map((permissionId) => ({
                        permission: { connect: { id: permissionId } },
                    })) || [],
                },
            },
        });
        res.status(201).json({ success: true, subRole });
    }
    catch (error) {
        console.error('Create SubRole Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create SubRole', error });
    }
};
exports.createSubRole = createSubRole;
// READ all SubRoles
const getAllSubRoles = async (req, res) => {
    try {
        const subRoles = await Prisma_1.default.subRole.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch SubRoles' });
    }
};
exports.getAllSubRoles = getAllSubRoles;
// READ single SubRole by ID
const getSubRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const subRole = await Prisma_1.default.subRole.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        if (!subRole)
            return res.status(404).json({ error: 'SubRole not found' });
        res.json(subRole);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch SubRole' });
    }
};
exports.getSubRoleById = getSubRoleById;
// UPDATE SubRole
const updateSubRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissionIds } = req.body;
        // Update SubRole main fields
        const updated = await Prisma_1.default.subRole.update({
            where: { id },
            data: {
                name,
                description,
                permissions: {
                    deleteMany: {}, // remove all previous permissions
                    create: permissionIds?.map((permissionId) => ({
                        permission: { connect: { id: permissionId } },
                    })) || [],
                },
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update SubRole Error:', error);
        res.status(500).json({ error: 'Failed to update SubRole' });
    }
};
exports.updateSubRole = updateSubRole;
// DELETE SubRole
const deleteSubRole = async (req, res) => {
    try {
        const { id } = req.params;
        await Prisma_1.default.subRolePermission.deleteMany({ where: { subRoleId: id } });
        await Prisma_1.default.subRole.delete({ where: { id } });
        res.json({ message: 'SubRole deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete SubRole' });
    }
};
exports.deleteSubRole = deleteSubRole;
// controllers/permissionController.ts
const assignPermissionsToSubRole = async (req, res) => {
    try {
        const { subRoleId, permissionIds } = req.body;
        const performedByUserId = req.user?.userId;
        const performedByName = req.user?.username || 'Admin';
        if (!subRoleId || !Array.isArray(permissionIds)) {
            return res.status(400).json({ message: 'Invalid data' });
        }
        // Start transaction
        await Prisma_1.default.$transaction(async (tx) => {
            // Step 1: Delete existing SubRolePermissions
            await tx.subRolePermission.deleteMany({ where: { subRoleId } });
            // Step 2: Re-assign new permissions to SubRole
            const data = permissionIds.map((permissionId) => ({
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
                const userPermissionData = userIds.flatMap((userId) => permissionIds.map((permissionId) => ({
                    userId,
                    permissionId,
                })));
                await tx.userPermission.createMany({
                    data: userPermissionData,
                    skipDuplicates: true,
                });
            }
        });
        const subRoleName = await Prisma_1.default.subRolePermission.findFirst({
            where: { subRoleId },
            include: {
                subRole: true, // includes all scalar fields of subRole, including 'name'
            },
        });
        // 🔔 Notify all users with that subRole
        const targetUsers = await Prisma_1.default.user.findMany({
            where: {
                subRoleId,
                status: 'ACTIVE',
            },
            select: { id: true },
        });
        try {
            const notifyUserPromises = targetUsers.map(user => (0, notificationUtils_1.createScopedNotification)({
                scope: 'ASSIGNED_USER',
                targetIds: { userId: user.id },
                data: {
                    title: 'Role Permissions Updated',
                    message: `Permissions for your role have been updated by ${performedByName}.`,
                    type: 'INFO',
                },
                visibilityLevel: 3,
                showPopup: true,
                excludeUserId: performedByUserId, // Don't notify admin again
            }));
            // 🔔 Notify admin who updated
            if (performedByUserId) {
                notifyUserPromises.push((0, notificationUtils_1.createScopedNotification)({
                    scope: 'ASSIGNED_USER',
                    targetIds: { userId: performedByUserId },
                    data: {
                        title: 'Sub-role Permissions Updated',
                        message: `You successfully updated permissions for ${subRoleName?.subRole.name} sub-role users.`,
                        type: 'INFO',
                    },
                    visibilityLevel: 0,
                    showPopup: true,
                }));
            }
            await Promise.all(notifyUserPromises);
        }
        catch (error) {
            console.error("Failed to notify subroles as their permissions updated: ", error);
        }
        res.status(200).json({ message: 'SubRole and user permissions updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign permissions to SubRole' });
    }
};
exports.assignPermissionsToSubRole = assignPermissionsToSubRole;
