import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/Prisma';

export const canApproveFixRequest = async (req: Request, res: Response, next: NextFunction) => {
    const reviewerId = req.user?.userId;
    const requestId = req.params.id;
    try {
        if (!reviewerId || !requestId) {
            return res.status(400).json({ message: "Missing reviewer ID or request ID" });
        }

        const reviewer = await prisma.users.findUnique({
            where: { id: reviewerId },
            include: { role: true },
        });

        if (!reviewer) {
            return res.status(404).json({ message: "Reviewer not found" });
        }

        // ✅ Allow Admins
        if (reviewer.role?.name === 'admin') {
            return next();
        }

        // Sub-role logic removed. Only admins can approve now.
        return res.status(403).json({ message: "You are not authorized to approve this request" });
    } catch (error) {
        console.error("Authorization error:", error);
        return res.status(500).json({ message: "Internal server error during authorization" });
    }
};

