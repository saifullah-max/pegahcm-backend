import { PermissionSource } from "@prisma/client";
import prisma from "../utils/Prisma";

export const getAllPermissions = async () => {
    return await prisma.permissions.findMany();
};

export const getUserEffectivePermissions = async (user_id: string) => {
    const user = await prisma.users.findUnique({
        where: { id: user_id },
        include: {
            role: {
                include: {
                    role_permission: {
                        include: { permission: true },
                    },
                },
            },
            user_permission: {
                include: { permission: true },
            },
        },
    });

    const rolePerms = user?.role?.role_permission?.map(rp => rp.permission) || [];
    const userPerms = user?.user_permission?.map(up => up.permission) || [];

    const allPermsMap = new Map<string, { module: string; action: string }>();
    [...rolePerms, ...userPerms].forEach(p => {
        allPermsMap.set(`${p.module}:${p.action}`, { module: p.module, action: p.action });
    });

    return Array.from(allPermsMap.values());
};

export const updateUserPermissions = async (user_id: string, permissions: { permission_id: string }[]) => {
    await prisma.user_permissions.deleteMany({ where: { user_id } });

    await prisma.user_permissions.createMany({
        data: permissions.map(p => ({
            user_id,
            permission_id: p.permission_id,
            source: PermissionSource.ROLE
        })),
    });
};

export const updateRolePermissions = async (role_id: string, permissions: { permission_id: string }[]) => {
    await prisma.role_permissions.deleteMany({ where: { role_id } });

    await prisma.role_permissions.createMany({
        data: permissions.map(p => ({
            role_id,
            permission_id: p.permission_id,
        })),
    });
};
