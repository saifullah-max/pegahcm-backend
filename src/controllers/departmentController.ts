import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new department
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department with same name exists
    const existingDepartment = await prisma.department.findUnique({
      where: { name }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const department = await prisma.department.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
};

// Get all departments
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        subDepartments: true
      }
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
};

// Get department by ID
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        subDepartments: true
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department'
    });
  }
};

// Update department
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if new name conflicts with other departments
    if (name !== existingDepartment.name) {
      const nameConflict = await prisma.department.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists'
        });
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name,
        description
      }
    });

    res.json({
      success: true,
      data: updatedDepartment
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
};

// Delete department
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: true,
        subDepartments: true
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has employees or sub-departments
    if (department.employees.length > 0 || department.subDepartments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with employees or sub-departments'
      });
    }

    await prisma.department.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
}; 