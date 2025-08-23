"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessSalary = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
var RoleTag;
(function (RoleTag) {
    RoleTag["HR"] = "HR";
    RoleTag["INTERVIEWER"] = "INTERVIEWER";
    RoleTag["RECRUITER"] = "RECRUITER";
    RoleTag["TRAINER"] = "TRAINER";
    RoleTag["FINANCE"] = "FINANCE";
})(RoleTag || (RoleTag = {}));
const canAccessSalary = async (req, res, next) => {
    if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized: No user info' });
    }
    // Get fresh user details from DB
    const dbUser = await Prisma_1.default.user.findUnique({
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
    console.log('Role:', dbUser.role.name);
    console.log('SubRole:', dbUser.subRole?.name);
    console.log('RoleTag:', dbUser.roleTag);
    const isAdmin = dbUser.role.name.toLowerCase() === 'admin';
    const isFinanceManager = dbUser.role.name.toLowerCase() === 'user' &&
        dbUser.subRole?.name.toLowerCase() === 'manager' &&
        dbUser.roleTag === RoleTag.FINANCE;
    if (isAdmin || isFinanceManager) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: No salary access' });
};
exports.canAccessSalary = canAccessSalary;
