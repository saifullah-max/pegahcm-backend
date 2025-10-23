import { Request, Response, NextFunction } from "express";
import prisma from "../utils/Prisma";

export const checkPermission = (module: string, action: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId; // Assuming auth middleware sets req.user

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              role_permission: {
                include: { permission: true },
              },
            },
          },
          user_permission: {
            include: { permission: true },
          },
        },
      });

      const permissions = [
        ...(user?.role?.role_permission?.map(
          (rp: any) => `${rp.permission.module}:${rp.permission.action}`
        ) || []),
        ...(user?.user_permission?.map(
          (up: any) => `${up.permission.module}:${up.permission.action}`
        ) || []),
      ];
      // console.log("permission:", permissions);

      // Special handling for 'view' to support view-own / view-all
      if (action === "view") {
        const hasViewAll = permissions.includes(`${module}:view-all`);
        const hasViewOwn =
          permissions.includes(`${module}:view-own`) ||
          permissions.includes(`${module}:view`);
        if (!hasViewAll && !hasViewOwn) {
            console.log(hasViewAll, hasViewOwn)
          res
            .status(403)
            .json({ message: "Forbidden: Missing view permission" });
          return;
        }
        // expose scope to controllers
        (req as any).permissionScope = hasViewAll ? "all" : "own";
        return next();
      }

      const hasPerm = permissions.includes(`${module}:${action}`);
      // console.log("Has permission?", hasPerm);

      if (!hasPerm) {
        res.status(403).json({ message: "Forbidden: Missing permission" });
        return;
      }

      return next(); // must return next()
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
