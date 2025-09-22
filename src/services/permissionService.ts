import prisma from "../utils/Prisma";

export const getAllPermissions = async () => {
    return await prisma.permission.findMany();
};

export const getUserEffectivePermissions = async (userId: string) => {
    const user = await prisma.user.findUnique({
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

    const allPermsMap = new Map<string, { module: string; action: string }>();
    [...rolePerms, ...userPerms].forEach(p => {
        allPermsMap.set(`${p.module}:${p.action}`, { module: p.module, action: p.action });
    });

    return Array.from(allPermsMap.values());
};

export const updateUserPermissions = async (userId: string, permissions: { permissionId: string }[]) => {
    await prisma.userPermission.deleteMany({ where: { userId } });

    await prisma.userPermission.createMany({
        data: permissions.map(p => ({
            userId,
            permissionId: p.permissionId,
        })),
    });
};

export const updateRolePermissions = async (roleId: string, permissions: { permissionId: string }[]) => {
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    await prisma.rolePermission.createMany({
        data: permissions.map(p => ({
            roleId,
            permissionId: p.permissionId,
        })),
    });
};
