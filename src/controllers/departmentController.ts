import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

// Create a new department under a head department
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, head_id } = req.body;

    if (!name || !head_id) {
      return res.status(400).json({
        success: false,
        message: 'Department name and head_id are required'
      });
    }

    const user_id = req.user?.userId

    // Check if head department exists
    const headDept = await prisma.head_departments.findUnique({
      where: { id: head_id }
    });

    if (!headDept) {
      return res.status(404).json({
        success: false,
        message: 'Head department not found'
      });
    }

    // Check if department with same name under this head exists
    const existingDepartment = await prisma.departments.findUnique({
      where: { name_head_id: { name, head_id } }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists under this head department'
      });
    }

    const department = await prisma.departments.create({
      data: {
        name,
        description,
        head_id,
        created_by: user_id

      },
      include: { head: true }
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

// Get all departments with their head department
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.departments.findMany({
      include: {
        head: true,
        employees: true
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

    const department = await prisma.departments.findUnique({
      where: { id },
      include: {
        head: true,
        employees: true
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
    const { name, description, head_id } = req.body;

    if (!name || !head_id) {
      return res.status(400).json({
        success: false,
        message: 'Department name and head_id are required'
      });
    }

    const existingDepartment = await prisma.departments.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check for name conflict under the same head
    if (name !== existingDepartment.name || head_id !== existingDepartment.head_id) {
      const conflict = await prisma.departments.findUnique({
        where: { name_head_id: { name, head_id } }
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists under this head department'
        });
      }
    }

    const updatedDepartment = await prisma.departments.update({
      where: { id },
      data: {
        name,
        description,
        head_id
      },
      include: { head: true }
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

    const department = await prisma.departments.findUnique({
      where: { id },
      include: { employees: true }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Prevent deletion if has employees
    if (department.employees.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with employees'
      });
    }

    await prisma.departments.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department'
    });
  }
};

// GET all head departments
export const getAllHeadDepartments = async (req: Request, res: Response) => {
  try {
    const headDepartments = await prisma.head_departments.findMany({
      orderBy: { name: 'asc' }, // optional: sort alphabetically
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        code: true,
      },
    });

    return res.json({
      success: true,
      data: headDepartments,
    });
  } catch (error) {
    console.error('Error fetching head departments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch head departments',
    });
  }
};