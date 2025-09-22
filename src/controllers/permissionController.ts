import { Request, Response } from 'express';
import { createScopedNotification } from '../utils/notificationUtils';
import prisma from '../utils/Prisma';

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { module, action, description } = req.body;

    // Check if permission already exists
    const existing = await prisma.permissions.findUnique({
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
    const permission = await prisma.permissions.create({
      data: {
        module,
        action,
        description,
      },
    });

    const adminRole = await prisma.roles.findUnique({
      where: { name: 'admin' },
      include: { users: true },
    });

    if (adminRole) {
      // 1. Assign to all users of admin role
      const userAssignments = adminRole.users.map((user) => ({
        user_id: user.id,
        permission_id: permission.id,
      }));

      await prisma.user_permissions.createMany({
        data: userAssignments,
        skipDuplicates: true,
      });

      // 2. Assign to the admin role itself
      await prisma.role_permissions.create({
        data: {
          role_id: adminRole.id,
          permission_id: permission.id,
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
    const permissions = await prisma.permissions.findMany();
    res.status(200).json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
};

export const assignPermissionsToUser = async (req: Request, res: Response) => {
  try {
    const { user_id, permission_ids } = req.body;
    const performed_by_user_id = req.user?.userId;
    const performed_by_name = req.user?.username || 'Admin';

    const data = permission_ids.map((permission_id: string) => ({
      user_id,
      permission_id,
    }));

    await prisma.user_permissions.deleteMany({ where: { user_id } });
    await prisma.user_permissions.createMany({ data, skipDuplicates: true });

    try {
      // 🔔 Notify target user
      await createScopedNotification({
        scope: 'ASSIGNED_USER',
        target_ids: { user_id },
        data: {
          title: 'Permissions Updated',
          message: `Your permissions have been updated by ${performed_by_name}.`,
          type: 'INFO',
        },
        visibilityLevel: 3,
        showPopup: true,
      });

      // 🔔 Notify admin himself
      if (performed_by_user_id) {
        await createScopedNotification({
          scope: 'ADMIN_ONLY',
          target_ids: { user_id: performed_by_user_id },
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

export const getPermissionsOfRole = async (req: Request, res: Response) => {
  try {
    const { RoleId } = req.params;

    const permissions = await prisma.role_permissions.findMany({
      where: { role_id: RoleId },
      include: {
        permission: true,
      },
    });

    const permissionIds = permissions.map((p) => p.permission_id);

    res.status(200).json(permissionIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch sub-role permissions' });
  }
};

export const updateSubRolePermissions = async (req: Request, res: Response) => {
  try {
    const { sub_role_id, permission_ids } = req.body;

    await prisma.sub_role_permissions.deleteMany({ where: { sub_role_id } });

    await prisma.sub_role_permissions.createMany({
      data: permission_ids.map((id: string) => ({ sub_role_id, permission_id: id })),
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
    const { user_id } = req.params;

    const permissions = await prisma.user_permissions.findMany({
      where: { user_id },
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
    const { user_id } = req.params;

    const permissions = await prisma.user_permissions.findMany({
      where: { user_id },
      include: { permission: true },
    });

    const permissionIds = permissions.map((p) => p.permission_id);
    res.status(200).json(permissionIds);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user permissions" });
  }
};