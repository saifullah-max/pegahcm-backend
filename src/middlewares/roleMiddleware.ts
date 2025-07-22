import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'Admin') {
    // console.log("req.user.role", req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
}; 