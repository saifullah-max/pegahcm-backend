import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

export const checkPermission = (module: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.userId; // Assuming auth middleware sets req.user

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

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

            const permissions = [
                ...(user?.role?.RolePermission?.map(rp => `${rp.permission.module}:${rp.permission.action}`) || []),
                ...(user?.UserPermission?.map(up => `${up.permission.module}:${up.permission.action}`) || []),
            ];
            console.log("permission:", permissions);

            const hasPerm = permissions.includes(`${module}:${action}`);
            console.log("Has permission?", hasPerm);

            if (!hasPerm) {
                res.status(403).json({ message: 'Forbidden: Missing permission' });
                return;
            }

            return next(); // ✅ must return next()
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};
