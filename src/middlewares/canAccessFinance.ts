import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/Prisma';

enum RoleTag {
    HR = "HR",
    INTERVIEWER = "INTERVIEWER",
    RECRUITER = "RECRUITER",
    TRAINER = "TRAINER",
    FINANCE = "FINANCE",
}

export const canAccessSalary = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    // Get fresh user details from DB
    const dbUser = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: {
            role: { select: { name: true } },
            sub_role: { select: { name: true } },
            role_tag: true,
        },
    });

    if (!dbUser) {
        return res.status(404).json({ message: 'User not found' });
    }
    console.log('Role:', dbUser.role.name);
    console.log('SubRole:', dbUser.sub_role?.name);
    console.log('RoleTag:', dbUser.role_tag);


    const isAdmin = dbUser.role.name.toLowerCase() === 'admin';
    const isFinanceManager =
        dbUser.role.name.toLowerCase() === 'user' &&
        dbUser.sub_role?.name.toLowerCase() === 'manager' &&
        dbUser.role_tag === RoleTag.FINANCE;

    if (isAdmin || isFinanceManager) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: No salary access' });
};
