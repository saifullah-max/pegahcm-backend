import { PrismaClient } from "@prisma/client";

// utils/notificationUtils.ts
const prisma = new PrismaClient();

export async function notifyUsersWithPermission(
    module: string,
    action: string,
    notificationData: { title: string; message: string; type: string }
) {
    // Find users with sub-roles that have this permission
    const users = await prisma.user.findMany({
        where: {
            subRole: {
                permissions: {
                    some: {
                        permission: {
                            module,
                            action
                        }
                    }
                }
            }
        },
        select: { id: true }
    });

    // Send notification to each user
    await prisma.notification.createMany({
        data: users.map((user) => ({
            userId: user.id,
            ...notificationData
        }))
    });
}

export async function notifyAdmins(data: { title: string; message: string; type: string }) {
    const admins = await prisma.user.findMany({
        where: { role: { name: 'Admin' } },
        select: { id: true }
    });

    await prisma.notification.createMany({
        data: admins.map(admin => ({ userId: admin.id, ...data }))
    });
}

export async function notifyHigherSubRoles(
    currentUserId: string,
    notification: { title: string; message: string; type: string }
) {
    const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { subRole: true }
    });

    if (!user?.subRole?.level) return;

    const higherSubRoles = await prisma.subRole.findMany({
        where: { level: { gt: user.subRole.level } },
        select: { id: true }
    });

    const higherUsers = await prisma.user.findMany({
        where: {
            subRoleId: { in: higherSubRoles.map(sr => sr.id) }
        },
        select: { id: true }
    });

    await prisma.notification.createMany({
        data: higherUsers.map(u => ({
            userId: u.id,
            ...notification
        }))
    });
}