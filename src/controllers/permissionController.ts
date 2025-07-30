import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { module, action, description } = req.body;

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

    const permission = await prisma.permission.create({
      data: {
        module,
        action,
        description,
      },
    });

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

    const data = permissionIds.map((permissionId: string) => ({
      userId,
      permissionId,
    }));

    await prisma.userPermission.createMany({
      data,
      skipDuplicates: true,
    });

    res.status(200).json({ message: 'Permissions assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to assign permissions' });
  }
};
