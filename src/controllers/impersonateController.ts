import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

export const impersonateUser = async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const admin = req.user; // Assumes JWT middleware attaches authenticated user

    try {
        // Check if admin is valid and has role
        const adminUser = await prisma.users.findUnique({
            where: { id: admin?.userId },
            include: { role: true },
        });

        if (!adminUser || adminUser.role.name !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Fetch the user to impersonate (include employee as well)
        const user = await prisma.users.findUnique({
            where: { id: user_id },
            include: { role: true, sub_role: true, employee: true },
        });

        if (!user || !user.role) {
            return res.status(404).json({ message: 'User or their role not found' });
        }

        // Generate impersonation token with same structure as login
        const token = jwt.sign(
            {
                user_id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role.name,
                sub_role: user.sub_role
                    ? {
                        id: user.sub_role.id,
                        name: user.sub_role.name,
                        description: user.sub_role.description,
                    }
                    : null,
                employee_id: user.employee?.id || null,
                impersonated_by: admin!.userId, // optional
            },
            process.env.JWT_SECRET!,
            { expiresIn: '30m' }
        );

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role.name,
                sub_role: user.sub_role,
                status: user.status,
                employee: user.employee,
                impersonated_by: admin!.userId 
            },
        });
    } catch (error) {
        console.error('Impersonation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
