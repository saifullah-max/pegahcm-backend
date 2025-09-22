import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  impersonatedBy?: string; // optional field to identify impersonation
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    // console.log('[Auth Middleware] Decoded payload:', decoded);
    if (decoded.impersonatedBy) {
      console.log(
        `[IMPERSONATION] This request is impersonated by admin ID: ${decoded.impersonatedBy}`
      );
    } else {
      console.log('[AUTH] Normal user login');
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
