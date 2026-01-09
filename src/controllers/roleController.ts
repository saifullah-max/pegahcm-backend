import { Request, Response } from 'express';
import prisma from '../utils/Prisma';
import { createScopedNotification } from '../utils/notificationUtils';
import { PermissionSource } from '@prisma/client';

// Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, level } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const role = await prisma.roles.create({
      data: {
        name,
        description,
        level: typeof level === 'number' ? level : null
      }
    });

    return res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.roles.findMany();
    return res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await prisma.roles.findUnique({
      where: { id }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, level } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const role = await prisma.roles.update({
      where: { id },
      data: {
        name,
        description,
        ...(level !== undefined ? { level } : {})
      }
    });

    return res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if role is being used by any users
    const usersWithRole = await prisma.users.findFirst({
      where: { role_id: id }
    });

    if (usersWithRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users'
      });
    }

    await prisma.roles.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// controllers/permissionController.ts
export const assignPermissionsToRole = async (req: Request, res: Response) => {
  try {
    const { role_id, permission_ids } = req.body;
    const performed_by_user_id = req.user?.userId;
    const performed_by_name = req.user?.username || 'Admin';

    if (!role_id || !Array.isArray(permission_ids)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Delete existing SubRolePermissions
      await tx.role_permissions.deleteMany({ where: { role_id } });

      // Step 2: Re-assign new permissions to SubRole
      const data = permission_ids.map((permission_id: string) => ({
        role_id,
        permission_id,
      }));
      await tx.role_permissions.createMany({ data, skipDuplicates: true });

      // Step 3: Get all users with this subRole
      const users = await tx.users.findMany({
        where: { role_id },
        select: { id: true },
      });

      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        // Step 4: Delete all UserPermissions for those users
        await tx.user_permissions.deleteMany({
          where: {
            user_id: { in: userIds },
            source: "ROLE"
          },
        });

        // add role-based permissions
        const userPermissionData = userIds.flatMap((user_id) =>
          permission_ids.map((permission_id: string) => ({
            user_id,
            permission_id,
            source: PermissionSource.ROLE,
          }))
        );

        await tx.user_permissions.createMany({
          data: userPermissionData,
          skipDuplicates: true,
        });

      }
    });

    const RoleName = await prisma.role_permissions.findFirst({
      where: { role_id },
      include: {
        role: true,  // includes all scalar fields of subRole, including 'name'
      },
    });


    // 🔔 Notify all users with that subRole
    const targetUsers = await prisma.users.findMany({
      where: {
        role_id,
        status: 'ACTIVE',
      },
      select: { id: true },
    });


    try {
      const notifyUserPromises = targetUsers.map(user =>
        createScopedNotification({
          scope: 'ASSIGNED_USER',
          target_ids: { user_id: user.id },
          data: {
            title: 'Role Permissions Updated',
            message: `Permissions for your role have been updated by ${performed_by_name}.`,
            type: 'INFO',
          },
          visibilityLevel: 3,
          showPopup: true,
          excludeUserId: performed_by_user_id, // Don't notify admin again
        })
      );

      // 🔔 Notify admin who updated
      if (performed_by_user_id) {
        notifyUserPromises.push(
          createScopedNotification({
            scope: 'ASSIGNED_USER',
            target_ids: { user_id: performed_by_user_id },
            data: {
              title: 'Sub-role Permissions Updated',
              message: `You successfully updated permissions for ${RoleName?.role.name} sub-role users.`,
              type: 'INFO',
            },
            visibilityLevel: 0,
            showPopup: true,
          })
        );
      }
      await Promise.all(notifyUserPromises);
    } catch (error) {
      console.error("Failed to notify subroles as their permissions updated: ", error)
    }

    res.status(200).json({ message: 'SubRole and user permissions updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to assign permissions to SubRole' });
  }
};