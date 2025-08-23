"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminOrHR = exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (req.user.role !== 'admin') {
        // console.log("req.user.role", req.user.role);
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};
exports.isAdmin = isAdmin;
const isAdminOrHR = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({
            success: false,
            message: 'Admin or HR access required',
        });
    }
    next();
};
exports.isAdminOrHR = isAdminOrHR;
