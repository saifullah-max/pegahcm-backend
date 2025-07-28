import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
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

export const isAdminOrHR = (req: Request, res: Response, next: NextFunction) => {
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
