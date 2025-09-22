import { Request, Response } from 'express';
import prisma from '../utils/Prisma';
import { createScopedNotification } from '../utils/notificationUtils';

// Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description
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
    const roles = await prisma.role.findMany();
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
    const role = await prisma.role.findUnique({
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
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description
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
    const usersWithRole = await prisma.user.findFirst({
      where: { roleId: id }
    });

    if (usersWithRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to users'
      });
    }

    await prisma.role.delete({
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
    const { RoleId, permissionIds } = req.body;
    const performedByUserId = req.user?.userId;
    const performedByName = req.user?.username || 'Admin';

    if (!RoleId || !Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Delete existing SubRolePermissions
      await tx.rolePermission.deleteMany({ where: { roleId: RoleId } });

      // Step 2: Re-assign new permissions to SubRole
      const data = permissionIds.map((permissionId: string) => ({
        roleId: RoleId,
        permissionId,
      }));
      await tx.rolePermission.createMany({ data, skipDuplicates: true });

      // Step 3: Get all users with this subRole
      const users = await tx.user.findMany({
        where: { roleId: RoleId },
        select: { id: true },
      });

      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        // Step 4: Delete all UserPermissions for those users
        await tx.userPermission.deleteMany({
          where: { userId: { in: userIds } },
        });

        // Step 5: Add new permissions to those users
        const userPermissionData = userIds.flatMap((userId) =>
          permissionIds.map((permissionId: string) => ({
            userId,
            permissionId,
          }))
        );

        await tx.userPermission.createMany({
          data: userPermissionData,
          skipDuplicates: true,
        });
      }
    });

    const RoleName = await prisma.rolePermission.findFirst({
      where: { roleId: RoleId },
      include: {
        role: true,  // includes all scalar fields of subRole, including 'name'
      },
    });


    // 🔔 Notify all users with that subRole
    const targetUsers = await prisma.user.findMany({
      where: {
        roleId: RoleId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });


    try {
      const notifyUserPromises = targetUsers.map(user =>
        createScopedNotification({
          scope: 'ASSIGNED_USER',
          targetIds: { userId: user.id },
          data: {
            title: 'Role Permissions Updated',
            message: `Permissions for your role have been updated by ${performedByName}.`,
            type: 'INFO',
          },
          visibilityLevel: 3,
          showPopup: true,
          excludeUserId: performedByUserId, // Don't notify admin again
        })
      );

      // 🔔 Notify admin who updated
      if (performedByUserId) {
        notifyUserPromises.push(
          createScopedNotification({
            scope: 'ASSIGNED_USER',
            targetIds: { userId: performedByUserId },
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