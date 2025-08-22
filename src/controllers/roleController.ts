import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

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