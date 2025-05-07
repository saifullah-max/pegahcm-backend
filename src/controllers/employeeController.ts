import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';

// Add multer type definitions
declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[];
      };
    }
  }
}

const prisma = new PrismaClient();

interface CreateEmployeeRequest {
  // User details
  email: string;
  password: string;
  fullName: string;
  roleId: string;

  // Employee details
  employeeNumber: string;
  fatherName: string;
  designation: string;
  joiningDate: Date;
  shiftId: string;
  departmentId: string;
  subDepartmentId?: string;
  managerId?: string;
  skills?: string; // Comma-separated string of skills
}

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      roleId,
      employeeNumber,
      fatherName,
      designation,
      joiningDate,
      shiftId,
      departmentId,
      subDepartmentId,
      managerId,
      skills
    }: CreateEmployeeRequest = req.body;

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Get profile image path if uploaded
    const profileImage = files.profileImage?.[0] 
      ? path.join('uploads', 'profiles', files.profileImage[0].filename)
      : undefined;

    // Process documents if uploaded
    const documents = files.documents?.map(file => ({
      name: file.originalname,
      url: path.join('uploads', 'documents', file.filename),
      type: file.mimetype
    }));

    // Process skills from comma-separated string
    const processedSkills = skills ? skills.split(',').map(skill => skill.trim()) : [];

    // Validate required fields
    if (!email || !password || !fullName || !roleId || !employeeNumber || 
        !fatherName || !designation || !joiningDate || !shiftId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if employee number already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeNumber }
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee number already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          username: email,
          email,
          passwordHash,
          fullName,
          roleId,
          status: 'active',
          dateJoined: new Date()
        }
      });

      // Create employee
      const employee = await prisma.employee.create({
        data: {
          userId: user.id,
          employeeNumber,
          departmentId,
          subDepartmentId,
          position: designation,
          fatherName,
          dateOfBirth: new Date(), // This should be added to the request
          hireDate: new Date(joiningDate),
          status: 'active',
          managerId,
          profileImage,
          documents: documents ? JSON.stringify(documents) : null,
          skills: skills || null
        }
      });

      return employee;
    });

    return res.status(201).json({
      success: true,
      data: {
        employee: {
          id: result.id,
          employeeNumber: result.employeeNumber,
          fullName: fullName,
          email: email,
          designation: result.position,
          department: departmentId,
          manager: managerId,
          status: result.status,
          profileImage: result.profileImage,
          documents: result.documents ? JSON.parse(result.documents) : [],
          skills: result.skills ? JSON.parse(result.skills) : []
        }
      }
    });

  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 