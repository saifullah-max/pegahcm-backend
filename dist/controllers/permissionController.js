"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionIdOfUser = exports.getPermissionsOfUser = exports.updateSubRolePermissions = exports.getPermissionsOfSubRole = exports.assignPermissionsToUser = exports.getAllPermissions = exports.createPermission = void 0;
const notificationUtils_1 = require("../utils/notificationUtils");
const Prisma_1 = __importDefault(require("../utils/Prisma"));
const createPermission = async (req, res) => {
    try {
        const { module, action, description } = req.body;
        // Check if permission already exists
        const existing = await Prisma_1.default.permission.findUnique({
            where: {
                module_action: {
                    module,
                    action,
                },
            },
        });
        if (existing) {
            return res.status(400).json({ message: 'Permission already exists' });
        }
        // Create the new permission
        const permission = await Prisma_1.default.permission.create({
            data: {
                module,
                action,
                description,
            },
        });
        // Find the 'admin' role (adjust field if needed)
        const adminRole = await Prisma_1.default.role.findUnique({
            where: { name: 'admin' }, // Change to `roleType` if you're using that
            include: { users: true },
        });
        if (adminRole) {
            // 1. Assign to all users of admin role
            const userAssignments = adminRole.users.map((user) => ({
                userId: user.id,
                permissionId: permission.id,
            }));
            await Prisma_1.default.userPermission.createMany({
                data: userAssignments,
                skipDuplicates: true,
            });
            // 2. Assign to the admin role itself
            await Prisma_1.default.rolePermission.create({
                data: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            });
        }
        res.status(201).json(permission);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create permission' });
    }
};
exports.createPermission = createPermission;
const getAllPermissions = async (req, res) => {
    try {
        const permissions = await Prisma_1.default.permission.findMany();
        res.status(200).json(permissions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch permissions' });
    }
};
exports.getAllPermissions = getAllPermissions;
const assignPermissionsToUser = async (req, res) => {
    try {
        const { userId, permissionIds } = req.body;
        const performedByUserId = req.user?.userId;
        const performedByName = req.user?.username || 'Admin';
        const data = permissionIds.map((permissionId) => ({
            userId,
            permissionId,
        }));
        await Prisma_1.default.userPermission.deleteMany({ where: { userId } });
        await Prisma_1.default.userPermission.createMany({ data, skipDuplicates: true });
        try {
            // 🔔 Notify target user
            await (0, notificationUtils_1.createScopedNotification)({
                scope: 'ASSIGNED_USER',
                targetIds: { userId },
                data: {
                    title: 'Permissions Updated',
                    message: `Your permissions have been updated by ${performedByName}.`,
                    type: 'INFO',
                },
                visibilityLevel: 3,
                showPopup: true,
            });
            // 🔔 Notify admin himself
            if (performedByUserId) {
                await (0, notificationUtils_1.createScopedNotification)({
                    scope: 'ADMIN_ONLY',
                    targetIds: { userId: performedByUserId },
                    data: {
                        title: 'Permission Update Executed',
                        message: `You successfully updated permissions for a user.`,
                        type: 'INFO',
                    },
                    visibilityLevel: 0,
                    showPopup: true,
                });
            }
        }
        catch (error) {
            console.error('Failed to send notification while updating user"/s" permission:', error);
        }
        res.status(200).json({ message: 'Permissions assigned successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to assign permissions' });
    }
};
exports.assignPermissionsToUser = assignPermissionsToUser;
const getPermissionsOfSubRole = async (req, res) => {
    try {
        const { subRoleId } = req.params;
        const permissions = await Prisma_1.default.subRolePermission.findMany({
            where: { subRoleId },
            include: {
                permission: true,
            },
        });
        const permissionIds = permissions.map((p) => p.permissionId);
        res.status(200).json(permissionIds);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch sub-role permissions' });
    }
};
exports.getPermissionsOfSubRole = getPermissionsOfSubRole;
const updateSubRolePermissions = async (req, res) => {
    try {
        const { subRoleId, permissionIds } = req.body;
        await Prisma_1.default.subRolePermission.deleteMany({ where: { subRoleId } });
        await Prisma_1.default.subRolePermission.createMany({
            data: permissionIds.map((id) => ({ subRoleId, permissionId: id })),
            skipDuplicates: true,
        });
        res.status(200).json({ message: 'Updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update' });
    }
};
exports.updateSubRolePermissions = updateSubRolePermissions;
// GET /permissions/user/:userId
const getPermissionsOfUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const permissions = await Prisma_1.default.userPermission.findMany({
            where: { userId },
            include: { permission: true },
        });
        const permissionStrings = permissions.map((p) => `${p.permission.module}:${p.permission.action}`);
        res.status(200).json(permissionStrings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user permissions" });
    }
};
exports.getPermissionsOfUser = getPermissionsOfUser;
// GET /permissions/user/:userId
const getPermissionIdOfUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const permissions = await Prisma_1.default.userPermission.findMany({
            where: { userId },
            include: { permission: true },
        });
        const permissionIds = permissions.map((p) => p.permissionId);
        res.status(200).json(permissionIds);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user permissions" });
    }
};
exports.getPermissionIdOfUser = getPermissionIdOfUser;
