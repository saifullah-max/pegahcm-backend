"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRolePermissions = exports.updateUserPermissions = exports.getUserEffectivePermissions = exports.getAllPermissions = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
const getAllPermissions = async () => {
    return await Prisma_1.default.permission.findMany();
};
exports.getAllPermissions = getAllPermissions;
const getUserEffectivePermissions = async (userId) => {
    const user = await Prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    RolePermission: {
                        include: { permission: true },
                    },
                },
            },
            UserPermission: {
                include: { permission: true },
            },
        },
    });
    const rolePerms = user?.role?.RolePermission?.map(rp => rp.permission) || [];
    const userPerms = user?.UserPermission?.map(up => up.permission) || [];
    const allPermsMap = new Map();
    [...rolePerms, ...userPerms].forEach(p => {
        allPermsMap.set(`${p.module}:${p.action}`, { module: p.module, action: p.action });
    });
    return Array.from(allPermsMap.values());
};
exports.getUserEffectivePermissions = getUserEffectivePermissions;
const updateUserPermissions = async (userId, permissions) => {
    await Prisma_1.default.userPermission.deleteMany({ where: { userId } });
    await Prisma_1.default.userPermission.createMany({
        data: permissions.map(p => ({
            userId,
            permissionId: p.permissionId,
        })),
    });
};
exports.updateUserPermissions = updateUserPermissions;
const updateRolePermissions = async (roleId, permissions) => {
    await Prisma_1.default.rolePermission.deleteMany({ where: { roleId } });
    await Prisma_1.default.rolePermission.createMany({
        data: permissions.map(p => ({
            roleId,
            permissionId: p.permissionId,
        })),
    });
};
exports.updateRolePermissions = updateRolePermissions;
