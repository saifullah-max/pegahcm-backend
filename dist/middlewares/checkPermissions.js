"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.userId; // Assuming auth middleware sets req.user
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            const user = await Prisma_1.default.user.findUnique({
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
            // console.log("permission:", permissions);
            const hasPerm = permissions.includes(`${module}:${action}`);
            // console.log("Has permission?", hasPerm);
            if (!hasPerm) {
                res.status(403).json({ message: 'Forbidden: Missing permission' });
                return;
            }
            return next(); // ✅ must return next()
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};
exports.checkPermission = checkPermission;
