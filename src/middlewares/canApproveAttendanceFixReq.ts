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
            include: { sub_role: true, role: true },
        });

        if (!reviewer) {
            return res.status(404).json({ message: "Reviewer not found" });
        }

        // ✅ Allow Admins regardless of subRole
        if (reviewer.role?.name === 'admin') {
            return next();
        }

        const request = await prisma.attendance_fix_requests.findUnique({
            where: { id: requestId },
            include: {
                employee: {
                    include: {
                        user: {
                            include: { sub_role: true },
                        },
                    },
                },
            },
        });

        if (!request) {
            return res.status(404).json({ message: "Fix request not found" });
        }

        const employeeSubRole = request.employee.user.sub_role;
        const reviewerSubRole = reviewer.sub_role;

        // ✅ If reviewer has no subRole but is not Admin (fallback), deny
        if (!reviewerSubRole) {
            return res.status(403).json({ message: "You are not authorized to approve this request" });
        }

        // ✅ Reviewer must have higher level (numerically lower)
        if (employeeSubRole && reviewerSubRole.level < employeeSubRole.level) {
            return next();
        }

        return res.status(403).json({ message: "You are not authorized to approve this request" });
    } catch (error) {
        console.error("Authorization error:", error);
        return res.status(500).json({ message: "Internal server error during authorization" });
    }
};

