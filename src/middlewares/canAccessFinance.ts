import { PrismaClient, RoleTag } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

export const canAccessSalary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    // Get fresh user details from DB
    const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            role: { select: { name: true } },
            subRole: { select: { name: true } },
            roleTag: true,
        },
    });

    if (!dbUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isAdmin = dbUser.role.name.toLowerCase() === 'admin';
    const isFinanceManager =
        dbUser.role.name.toLowerCase() === 'user' &&
        dbUser.subRole?.name.toLowerCase() === 'manager' &&
        dbUser.roleTag === RoleTag.FINANCE;

    if (isAdmin || isFinanceManager) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: No salary access' });
};
