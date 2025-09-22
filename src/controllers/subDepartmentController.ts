import { Request, Response } from 'express';
import prisma from '../utils/Prisma';

// Create a new sub-department
export const createSubDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, department_id } = req.body;

    if (!name || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Sub-department name and department ID are required'
      });
    }

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: department_id }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if sub-department with same name exists
    const existingSubDepartment = await prisma.sub_departments.findUnique({
      where: { name }
    });

    if (existingSubDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Sub-department with this name already exists'
      });
    }

    const subDepartment = await prisma.sub_departments.create({
      data: {
        name,
        description,
        department_id
      }
    });
    const getAllSubDepartments = await prisma.sub_departments.findMany({});
    console.log("All sub dept:",  getAllSubDepartments);

    res.status(201).json({
      success: true,
      data: getAllSubDepartments
    });
  } catch (error) {
    console.error('Error creating sub-department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sub-department'
    });
  }
};

// Get all sub-departments
export const getAllSubDepartments = async (req: Request, res: Response) => {
  try {
    const subDepartments = await prisma.sub_departments.findMany({
      include: {
        department: true,
        employees: true
      }
    });

    res.json({
      success: true,
      data: subDepartments
    });
  } catch (error) {
    console.error('Error fetching sub-departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-departments'
    });
  }
};

// Get sub-department by ID
export const getSubDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subDepartment = await prisma.sub_departments.findUnique({
      where: { id },
      include: {
        department: true,
        employees: true
      }
    });

    if (!subDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Sub-department not found'
      });
    }

    res.json({
      success: true,
      data: subDepartment
    });
  } catch (error) {
    console.error('Error fetching sub-department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-department'
    });
  }
};

// Update sub-department
export const updateSubDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, department_id } = req.body;

    if (!name || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Sub-department name and department ID are required'
      });
    }

    // Check if sub-department exists
    const existingSubDepartment = await prisma.sub_departments.findUnique({
      where: { id }
    });

    if (!existingSubDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Sub-department not found'
      });
    }

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: department_id }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if new name conflicts with other sub-departments
    if (name !== existingSubDepartment.name) {
      const nameConflict = await prisma.sub_departments.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Sub-department with this name already exists'
        });
      }
    }

    const updatedSubDepartment = await prisma.sub_departments.update({
      where: { id },
      data: {
        name,
        description,
        department_id
      }
    });

    res.json({
      success: true,
      data: updatedSubDepartment
    });
  } catch (error) {
    console.error('Error updating sub-department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sub-department'
    });
  }
};

// Delete sub-department
export const deleteSubDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if sub-department exists
    const subDepartment = await prisma.sub_departments.findUnique({
      where: { id },
      include: {
        employees: true
      }
    });

    if (!subDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Sub-department not found'
      });
    }

    // Check if sub-department has employees
    if (subDepartment.employees.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sub-department with employees'
      });
    }

    await prisma.sub_departments.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting sub-department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sub-department'
    });
  }
}; 