"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.impersonateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Prisma_1 = __importDefault(require("../utils/Prisma"));
const impersonateUser = async (req, res) => {
    const { userId } = req.params;
    const admin = req.user; // Assumes JWT middleware attaches authenticated user
    try {
        // Check if admin is valid and has role
        const adminUser = await Prisma_1.default.user.findUnique({
            where: { id: admin?.userId },
            include: { role: true },
        });
        if (!adminUser || adminUser.role.name !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        // Fetch the user to impersonate (include employee as well)
        const user = await Prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { role: true, subRole: true, employee: true },
        });
        if (!user || !user.role) {
            return res.status(404).json({ message: 'User or their role not found' });
        }
        // Generate impersonation token with same structure as login
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role.name,
            subRole: user.subRole
                ? {
                    id: user.subRole.id,
                    name: user.subRole.name,
                    description: user.subRole.description,
                }
                : null,
            employeeId: user.employee?.id || null,
            impersonatedBy: admin.userId, // optional
        }, process.env.JWT_SECRET, { expiresIn: '30m' });
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role.name,
                subRole: user.subRole,
                status: user.status,
                employee: user.employee,
                impersonatedBy: admin.userId
            },
        });
    }
    catch (error) {
        console.error('Impersonation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.impersonateUser = impersonateUser;
