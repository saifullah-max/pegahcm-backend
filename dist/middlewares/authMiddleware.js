"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] No token provided');
        return res.status(401).json({
            success: false,
            message: 'Access token missing or malformed',
        });
    }
    const token = authHeader.split(' ')[1];
    // console.log('[Auth Middleware] Incoming token:', token);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // console.log('[Auth Middleware] Decoded payload:', decoded);
        if (decoded.impersonatedBy) {
            console.log(`[IMPERSONATION] This request is impersonated by admin ID: ${decoded.impersonatedBy}`);
        }
        else {
            console.log('[AUTH] Normal user login');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('[AUTH] Token verification failed:', error);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
exports.authenticateToken = authenticateToken;
