import { Request, Response } from 'express';
import { createScopedNotification } from '../utils/notificationUtils';
import prisma from '../utils/Prisma';

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { module, action, description } = req.body;

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: {
        module_action: {
          module,
          action,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Permission already exists' });
    }

    // Create the new permission
    const permission = await prisma.permission.create({
      data: {
        module,
        action,
        description,
      },
    });

    // Find the 'admin' role (adjust field if needed)
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }, // Change to `roleType` if you're using that
      include: { users: true },
    });

    if (adminRole) {
      // 1. Assign to all users of admin role
      const userAssignments = adminRole.users.map((user) => ({
        userId: user.id,
        permissionId: permission.id,
      }));

      await prisma.userPermission.createMany({
        data: userAssignments,
        skipDuplicates: true,
      });

      // 2. Assign to the admin role itself
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    res.status(201).json(permission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create permission' });
  }
};

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.status(200).json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
};

export const assignPermissionsToUser = async (req: Request, res: Response) => {
  try {
    const { userId, permissionIds } = req.body;
    const performedByUserId = req.user?.userId;
    const performedByName = req.user?.username || 'Admin';

    const data = permissionIds.map((permissionId: string) => ({
      userId,
      permissionId,
    }));

    await prisma.userPermission.deleteMany({ where: { userId } });
    await prisma.userPermission.createMany({ data, skipDuplicates: true });

    try {
      // 🔔 Notify target user
      await createScopedNotification({
        scope: 'ASSIGNED_USER',
        targetIds: { userId },
        data: {
          title: 'Permissions Updated',
          message: `Your permissions have been updated by ${performedByName}.`,
          type: 'INFO',
        },
        visibilityLevel: 3,
        showPopup: true,
      });

      // 🔔 Notify admin himself
      if (performedByUserId) {
        await createScopedNotification({
          scope: 'ADMIN_ONLY',
          targetIds: { userId: performedByUserId },
          data: {
            title: 'Permission Update Executed',
            message: `You successfully updated permissions for a user.`,
            type: 'INFO',
          },
          visibilityLevel: 0,
          showPopup: true,
        });
      }
    } catch (error) {
      console.error('Failed to send notification while updating user"/s" permission:', error)
    }

    res.status(200).json({ message: 'Permissions assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to assign permissions' });
  }
};

export const getPermissionsOfSubRole = async (req: Request, res: Response) => {
  try {
    const { subRoleId } = req.params;

    const permissions = await prisma.subRolePermission.findMany({
      where: { subRoleId },
      include: {
        permission: true,
      },
    });

    const permissionIds = permissions.map((p) => p.permissionId);

    res.status(200).json(permissionIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch sub-role permissions' });
  }
};

export const updateSubRolePermissions = async (req: Request, res: Response) => {
  try {
    const { subRoleId, permissionIds } = req.body;

    await prisma.subRolePermission.deleteMany({ where: { subRoleId } });

    await prisma.subRolePermission.createMany({
      data: permissionIds.map((id: string) => ({ subRoleId, permissionId: id })),
      skipDuplicates: true,
    });

    res.status(200).json({ message: 'Updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update' });
  }
};

// GET /permissions/user/:userId
export const getPermissionsOfUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const permissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const permissionStrings = permissions.map(
      (p) => `${p.permission.module}:${p.permission.action}`
    );

    res.status(200).json(permissionStrings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user permissions" });
  }
};

// GET /permissions/user/:userId
export const getPermissionIdOfUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const permissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const permissionIds = permissions.map((p) => p.permissionId);
    res.status(200).json(permissionIds);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user permissions" });
  }
};