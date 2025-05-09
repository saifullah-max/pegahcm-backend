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
  fatherName: string;
  designation: string;
  joiningDate: Date;
  dateOfBirth: Date;
  shiftId: string;
  departmentId: string;
  subDepartmentId?: string;
  managerId?: string;
  skills?: string; // Comma-separated string of skills
  
  // New fields
  workLocation: 'Onsite' | 'Remote' | 'Hybrid';
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  salary: number;
}

// Function to generate employee number
async function generateEmployeeNumber(): Promise<string> {
  // Get the current year
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  // Get the latest employee number for the current year
  const latestEmployee = await prisma.employee.findFirst({
    where: {
      employeeNumber: {
        startsWith: `EMP${currentYear}`
      }
    },
    orderBy: {
      employeeNumber: 'desc'
    }
  });

  let sequence = 1;
  if (latestEmployee) {
    // Extract the sequence number from the latest employee number
    const latestSequence = parseInt(latestEmployee.employeeNumber.slice(-4));
    sequence = latestSequence + 1;
  }

  // Format: EMPYY#### (e.g., EMP240001)
  return `EMP${currentYear}${sequence.toString().padStart(4, '0')}`;
}

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      roleId,
      fatherName,
      designation,
      joiningDate,
      dateOfBirth,
      shiftId,
      departmentId,
      subDepartmentId,
      managerId,
      skills,
      workLocation,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone,
      salary
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
    if (!email || !password || !fullName || !roleId || 
        !fatherName || !designation || !joiningDate || !dateOfBirth || !shiftId || 
        !departmentId || !workLocation || !gender || !address || 
        !emergencyContactName || !emergencyContactPhone || !salary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate work location
    console.log('Received workLocation:', workLocation);
    console.log('workLocation type:', typeof workLocation);
    console.log('workLocation length:', workLocation.length);
    console.log('workLocation char codes:', Array.from(workLocation).map(c => c.charCodeAt(0)));

    if (!['Onsite', 'Remote', 'Hybrid'].includes(workLocation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work location. Must be one of: Onsite, Remote, Hybrid',
        received: workLocation
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

    // Generate employee number
    const employeeNumber = await generateEmployeeNumber();

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
          dateOfBirth: new Date(dateOfBirth),
          hireDate: new Date(joiningDate),
          status: 'active',
          managerId,
          profileImage,
          documents: documents ? JSON.stringify(documents) : null,
          skills: skills || null,
          workLocation,
          gender,
          address,
          emergencyContactName,
          emergencyContactPhone,
          salary
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
          skills: result.skills ? result.skills.split(',').map(skill => skill.trim()) : [],
          workLocation: result.workLocation,
          gender: result.gender,
          address: result.address,
          emergencyContact: {
            name: result.emergencyContactName,
            phone: result.emergencyContactPhone
          },
          salary: result.salary
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

export const listEmployees = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      department,
      status,
      workLocation
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { employeeNumber: { contains: search as string } },
        { position: { contains: search as string } },
        { user: { fullName: { contains: search as string } } }
      ];
    }

    if (department) {
      where.departmentId = department;
    }

    if (status) {
      where.status = status;
    }

    if (workLocation) {
      where.workLocation = workLocation;
    }

    // Get total count for pagination
    const total = await prisma.employee.count({ where });

    // Get employees with related data
    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            status: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        subDepartment: {
          select: {
            name: true
          }
        },
        manager: {
          select: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        hireDate: 'desc'
      }
    });

    // Format the response
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      fullName: emp.user.fullName,
      email: emp.user.email,
      designation: emp.position,
      department: emp.department?.name,
      subDepartment: emp.subDepartment?.name,
      manager: emp.manager?.user.fullName,
      status: emp.status,
      profileImage: emp.profileImage,
      workLocation: emp.workLocation,
      gender: emp.gender,
      address: emp.address,
      emergencyContact: {
        name: emp.emergencyContactName,
        phone: emp.emergencyContactPhone
      },
      salary: emp.salary,
      skills: emp.skills ? emp.skills.split(',').map(skill => skill.trim()) : [],
      documents: emp.documents ? JSON.parse(emp.documents) : []
    }));

    return res.json({
      success: true,
      data: {
        employees: formattedEmployees,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });

  } catch (error) {
    console.error('List employees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 