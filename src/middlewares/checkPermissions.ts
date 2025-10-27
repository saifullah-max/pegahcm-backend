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

      // Special handling for Ticket comments: assignee bypass
      if (module === "Ticket" && action === "comment") {
        const ticketId =
          (req.params as any).ticketId ||
          (req.params as any).id ||
          (req.body as any).ticket_id;
        if (!ticketId) {
          // If no ticket id provided, fall back to normal permission check
          // (controller should preferably pass ticket id)
        } else {
          const ticket = await prisma.tickets.findUnique({
            where: { id: ticketId },
            include: { assignees: { select: { user_id: true } } },
          });

          const isAssignee =
            !!ticket &&
            ticket.assignees.some((a: any) => a.user_id === userId);

          if (isAssignee) {
            return next();
          }
        }
        // not an assignee: continue to normal permission checks below to ensure user has Ticket:comment
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

      // Special handling for 'view' to support view-own / view-all
      if (action === "view") {
        const hasViewAll = permissions.includes(`${module}:view-all`);
        const hasViewOwn =
          permissions.includes(`${module}:view-own`) ||
          permissions.includes(`${module}:view`);
        if (!hasViewAll && !hasViewOwn) {
          console.log("has perm:", hasViewAll, hasViewOwn);

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
      console.log("has perm:", hasPerm);

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
