import e, { Request, Response } from 'express';
import { Prisma, PrismaClient, RoleTag } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createScopedNotification } from '../utils/notificationUtils';
import { JwtPayload } from "jsonwebtoken";


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
  fullName: string;
  email: string;
  phoneNumber: number;
  password: string;
  gender: string;
  dateOfBirth: Date;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;

  roleId: string;
  subRoleId?: string;
  roleTag?: string;

  // Employee details
  departmentId: string;
  subDepartmentId?: string;
  designation: string;
  joiningDate: Date;
  status: 'active' | 'inactive' | 'onLeave';
  salary: number;

  skills?: string; // Comma-separated string of skills

  workLocation: 'Onsite' | 'Remote' | 'Hybrid';
  shiftId: string;

  fatherName: string;
  // managerId?: string;
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
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
      fullName,
      email,
      phoneNumber,
      password,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      address,
      roleId,
      subRoleId,
      roleTag,
      departmentId,
      subDepartmentId,
      designation,
      joiningDate,
      status,
      salary,
      skills,
      workLocation,
      shiftId,
      fatherName,
    }: CreateEmployeeRequest = req.body;

    const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };

    const profileImage = files.profileImage?.[0]
      ? path.join('uploads', 'profiles', files.profileImage[0].filename)
      : undefined;

    const documents = files.documents?.map(file => ({
      name: file.originalname,
      url: path.join('uploads', 'documents', file.filename),
      type: file.mimetype
    }));

    if (!['Onsite', 'Remote', 'Hybrid'].includes(workLocation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work location. Must be one of: Onsite, Remote, Hybrid',
        received: workLocation
      });
    }

    const processedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
        ? skills.split(',').map(s => s.trim())
        : [];

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const employeeNumber = await generateEmployeeNumber();
    const passwordHash = await bcrypt.hash(password, 10);

    const prismaRoleTag: RoleTag | null = Object.values(RoleTag).includes(roleTag as RoleTag)
      ? (roleTag as RoleTag)
      : null;

    const result = await prisma.$transaction(async (prismaTx) => {
      const newUser = await prismaTx.user.create({
        data: {
          username: email,
          email,
          passwordHash,
          fullName,
          roleId,
          subRoleId,
          roleTag: prismaRoleTag,
          status,
          dateJoined: new Date()
        }
      });

      if (subRoleId) {
        const subRolePermissions = await prismaTx.subRolePermission.findMany({
          where: { subRoleId },
          select: { permissionId: true }
        });

        if (subRolePermissions.length > 0) {
          await prismaTx.userPermission.createMany({
            data: subRolePermissions.map((sp) => ({
              userId: newUser.id,
              permissionId: sp.permissionId
            })),
            skipDuplicates: true
          });
        }
      }

      const subRole = subRoleId
        ? await prismaTx.subRole.findUnique({
          where: { id: subRoleId },
          select: { name: true },
        })
        : null;

      const isDirector = subRole?.name?.toLowerCase() === 'director';

      const newEmployee = await prismaTx.employee.create({
        data: {
          userId: newUser.id,
          phoneNumber: String(phoneNumber),
          employeeNumber,
          shiftId,
          departmentId: !isDirector ? departmentId : null,
          subDepartmentId: !isDirector ? subDepartmentId : null,
          position: designation,
          fatherName: fatherName ?? undefined,
          dateOfBirth: new Date(dateOfBirth),
          hireDate: new Date(joiningDate),
          status,
          skills: processedSkills.length > 0 ? processedSkills.join(',') : null,
          workLocation,
          gender,
          address,
          emergencyContactName,
          emergencyContactPhone,
          salary
        }
      });


      return {
        user: newUser,
        employee: newEmployee,
        isDirector
      };
    });

    try {
      await Promise.all([
        createScopedNotification({
          scope: "ADMIN_ONLY",
          data: {
            title: "New Employee Joined",
            message: `${fullName} has joined the company.`,
            type: "Employee",
          },
          visibilityLevel: 0,
        }),

        createScopedNotification({
          scope: "DIRECTORS_HR",
          data: {
            title: "New Employee Joined",
            message: `${fullName} has joined the company.`,
            type: "Employee",
          },
          visibilityLevel: 1,
        }),

        !result.isDirector &&
        departmentId &&
        createScopedNotification({
          scope: "MANAGERS_DEPT",
          data: {
            title: "New Department Member",
            message: `${fullName} has joined your department.`,
            type: "Employee",
          },
          targetIds: {
            departmentId,
            employeeId: result.employee.id,
          },
          visibilityLevel: 2,
          excludeUserId: result.user.id,
        }),

        !result.isDirector &&
        subDepartmentId &&
        createScopedNotification({
          scope: "TEAMLEADS_SUBDEPT",
          data: {
            title: "New Team Member",
            message: `${fullName} has joined your sub-department.`,
            type: "Employee",
          },
          targetIds: {
            subDepartmentId,
            employeeId: result.employee.id,
          },
          visibilityLevel: 3,
          excludeUserId: result.user.id
        }),

        createScopedNotification({
          scope: "EMPLOYEE_ONLY",
          data: {
            title: "Welcome to the Team 🎉",
            message: `Hey ${fullName}, we're excited to have you onboard!`,
            type: "Employee",
          },
          targetIds: { userId: result.user.id },
          visibilityLevel: 3,
        }),
      ]);
    } catch (error) {
      console.error("Some error occurred while notifying user", error);
    }

    return res.status(201).json({
      success: true,
      message: 'Employee and user created successfully.',
      data: {
        employee: {
          id: result.employee.id,
          employeeNumber: result.employee.employeeNumber,
          fullName,
          email,
          designation: result.employee.position,
          department: departmentId,
          status: result.employee.status,
          skills: result.employee.skills
            ? result.employee.skills.split(',').map(skill => skill.trim())
            : [],
          workLocation: result.employee.workLocation,
          gender: result.employee.gender,
          address: result.employee.address,
          emergencyContact: {
            name: result.employee.emergencyContactName,
            phone: result.employee.emergencyContactPhone
          },
          salary: result.employee.salary
        }
      }
    });

  } catch (error: any) {
    console.error('Create employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || error
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
            id: true,
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
      workLocation: emp.workLocation,
      gender: emp.gender,
      address: emp.address,
      emergencyContact: {
        name: emp.emergencyContactName,
        phone: emp.emergencyContactPhone
      },
      salary: emp.salary,
      skills: emp.skills ? emp.skills.split(',').map(skill => skill.trim()) : [],
      hireDate: emp.hireDate,

      // ✅ ADD THIS LINE
      userId: emp.user.id

      // profileImage and documents skipped
    }));


    // console.log("Data:", employees);
    // console.log("DATA", formattedEmployees);
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

export const ListSingleEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id },
          { userId: id }
        ]
      },
      include: {
        user: true,
        shift: true,
      }
    });

    if (!employee || !employee.user) {
      return res.status(404).json({
        success: false,
        message: 'Employee or related user not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: employee.user.id,
          fullName: employee.user.fullName,
          email: employee.user.email,
          roleId: employee.user.roleId,
          subRoleId: employee.user.subRoleId,
          status: employee.user.status,
          dateJoined: employee.user.dateJoined,
        },
        employee: {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          designation: employee.position,
          departmentId: employee.departmentId,
          subDepartmentId: employee.subDepartmentId,
          gender: employee.gender,
          fatherName: employee.fatherName,
          address: employee.address,
          salary: employee.salary,
          shiftId: employee.shiftId,
          shift: employee.shift?.name,
          status: employee.status,
          dateOfBirth: employee.dateOfBirth,
          hireDate: employee.hireDate,
          skills: employee.skills?.split(',').map(s => s.trim()) || [],
          workLocation: employee.workLocation,
          emergencyContactName: employee.emergencyContactName,
          emergencyContactPhone: employee.emergencyContactPhone,
        },
      },
    });
  } catch (error: any) {
    console.error('ListSingleEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message || error,
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      phoneNumber,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      address,
      roleId,
      subRoleId,
      departmentId,
      subDepartmentId,
      designation,
      joiningDate,
      status,
      salary,
      skills,
      workLocation,
      shift,
      fatherName,
    } = req.body;

    const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };

    const profileImage = files.profileImage?.[0]
      ? path.join('uploads', 'profiles', files.profileImage[0].filename)
      : undefined;

    const documents = files.documents?.map(file => ({
      name: file.originalname,
      url: path.join('uploads', 'documents', file.filename),
      type: file.mimetype
    }));

    if (workLocation && !['Onsite', 'Remote', 'Hybrid'].includes(workLocation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work location. Must be one of: Onsite, Remote, Hybrid',
        received: workLocation
      });
    }

    const processedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
        ? skills.split(',').map(s => s.trim())
        : [];

    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        phoneNumber,
        departmentId,
        subDepartmentId,
        position: designation,
        fatherName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        hireDate: joiningDate ? new Date(joiningDate) : undefined,
        status,
        skills: processedSkills.length > 0 ? processedSkills.join(',') : null,
        workLocation,
        gender,
        address,
        emergencyContactName,
        emergencyContactPhone,
        salary: salary ? Number(salary) : undefined,
      }
    });

    // Update user
    const updateUserData: any = {};
    if (email) updateUserData.email = email;
    if (fullName) updateUserData.fullName = fullName;
    if (roleId) updateUserData.roleId = roleId;
    if (subRoleId) updateUserData.subRoleId = subRoleId;

    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id: updatedEmployee.userId },
        data: updateUserData
      });
    }

    // 👇 Notifications
    try {
      const performedBy = req.user as unknown as CustomJwtPayload;
      const performer = await prisma.user.findUnique({ where: { id: performedBy.userId } });
      const updatedUser = await prisma.user.findUnique({
        where: { id: updatedEmployee.userId }
      });

      const performerName = performer?.fullName ?? 'Someone';
      const employeeName = fullName || updatedUser?.fullName || 'An employee';

      await Promise.all([
        createScopedNotification({
          scope: 'ADMIN_ONLY',
          data: {
            title: 'Employee Info Updated',
            message: `${employeeName}'s info was updated by ${performerName}.`,
            type: 'Employee'
          },
          visibilityLevel: 0
        }),
        createScopedNotification({
          scope: 'DIRECTORS_HR',
          data: {
            title: 'Employee Info Updated',
            message: `${employeeName}'s profile was updated.`,
            type: 'Employee'
          },
          visibilityLevel: 1
        }),
        createScopedNotification({
          scope: 'EMPLOYEE_ONLY',
          data: {
            title: 'Your Info Was Updated',
            message: `Your profile was updated. Please verify the changes.`,
            type: 'Employee'
          },
          targetIds: { userId: updatedEmployee.userId },
          visibilityLevel: 3
        })
      ]);
    } catch (err) {
      console.error('Notification error after updateEmployee:', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: {
        employee: {
          id: updatedEmployee.id,
          employeeNumber: updatedEmployee.employeeNumber,
          fullName: fullName || undefined,
          email: email || undefined,
          designation: updatedEmployee.position,
          department: departmentId,
          status: updatedEmployee.status,
          skills: updatedEmployee.skills?.split(',').map(s => s.trim()) || [],
          workLocation: updatedEmployee.workLocation,
          gender: updatedEmployee.gender,
          address: updatedEmployee.address,
          emergencyContact: {
            name: updatedEmployee.emergencyContactName,
            phone: updatedEmployee.emergencyContactPhone
          },
          salary: updatedEmployee.salary
        }
      }
    });

  } catch (error: any) {
    console.error('Update employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || error
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.delete({ where: { id } });

      if (employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { status: 'inactive' }
        });
      }
    });

    // 👇 Notifications
    try {
      const performedBy = req.user as unknown as CustomJwtPayload;
      const performer = await prisma.user.findUnique({ where: { id: performedBy.userId } });

      const performerName = performer?.fullName ?? 'Someone';
      const employeeName = employee.user?.fullName || 'An employee';

      await Promise.all([
        createScopedNotification({
          scope: 'ADMIN_ONLY',
          data: {
            title: 'Employee Deleted',
            message: `${employeeName} was removed by ${performerName}.`,
            type: 'Employee'
          },
          visibilityLevel: 0,
          showPopup: true
        }),
        createScopedNotification({
          scope: 'DIRECTORS_HR',
          data: {
            title: 'Employee Removed',
            message: `${employeeName} was removed from the company.`,
            type: 'Employee'
          },
          visibilityLevel: 1,
          showPopup: true
        }),
        employee.departmentId &&
        createScopedNotification({
          scope: 'MANAGERS_DEPT',
          data: {
            title: 'Team Member Removed',
            message: `${employeeName} was removed from your department.`,
            type: 'Employee'
          },
          targetIds: { departmentId: employee.departmentId },
          visibilityLevel: 2,
          excludeUserId: employee.userId,
          showPopup: true
        }),
        employee.subDepartmentId &&
        createScopedNotification({
          scope: 'TEAMLEADS_SUBDEPT',
          data: {
            title: 'Team Member Removed',
            message: `${employeeName} was removed from your sub-department.`,
            type: 'Employee'
          },
          targetIds: { subDepartmentId: employee.subDepartmentId },
          visibilityLevel: 3,
          excludeUserId: employee.userId,
          showPopup: true
        })
      ]);
    } catch (err) {
      console.error('Notification error after deleteEmployee:', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Employee deleted and user marked as inactive successfully'
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /users/inactive
export const listInactiveUsers = async (req: Request, res: Response) => {
  try {
    const inactiveUsers = await prisma.user.findMany({
      where: { status: "inactive" },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        roleId: true,
        status: true,
        dateJoined: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        users: inactiveUsers,
      },
    });
  } catch (error) {
    console.error('List inactive users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// delete user only if linked employee is deleted
export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    // Check if employee linked to user exists
    const employee = await prisma.employee.findUnique({ where: { userId } });

    if (employee) {
      return res.status(400).json({
        message: "Cannot delete user while linked employee exists."
      });
    }

    // Delete related data in dependent order

    await prisma.userNotification.deleteMany({ where: { userId } });
    await prisma.userPermission.deleteMany({ where: { userId } });
    await prisma.systemLog.deleteMany({ where: { userId } });
    await prisma.bulkUpload.deleteMany({ where: { uploadedById: userId } });
    await prisma.leaveRequest.deleteMany({ where: { approvedById: userId } });
    await prisma.vacation.deleteMany({ where: { approvedById: userId } });
    await prisma.onboardingProcess.deleteMany({ where: { assignedHRId: userId } });
    await prisma.hRProcess.deleteMany({ where: { initiatedById: userId } });

    // Resignation has two fields referencing User, delete by both
    await prisma.resignation.deleteMany({ where: { processedById: userId } });
    await prisma.resignation.deleteMany({ where: { clearanceResponsibleId: userId } });

    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.attendanceFixRequest.deleteMany({ where: { reviewedById: userId } });

    // Finally, delete the user
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "User and all related data deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while deleting user." });
  }
};

// upload image
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = (req.files as any)?.profileImage?.[0];
    const { employeeId } = req.body;

    if (!file) return res.status(400).json({ message: 'No image provided' });
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const saved = await prisma.employeeImage.create({
      data: {
        id: uuidv4(),
        employeeId: employee.id,
        name: file.originalname,
        mimeType: file.mimetype,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date(),
      },
    });

    res.status(200).json({ message: 'Image uploaded successfully', saved });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ message: 'Image upload failed', error: err });
  }
};

// upload docs
export const uploadEmployeeDocuments = async (req: Request, res: Response) => {
  try {
    const files = (req.files as any)?.documents;
    const { employeeId } = req.body;

    if (!files || files.length === 0) return res.status(400).json({ message: 'No documents uploaded' });
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const savedDocuments = await Promise.all(
      files.map((file: Express.Multer.File) =>
        prisma.employeeDocument.create({
          data: {
            id: uuidv4(),
            employeeId,
            name: file.originalname,
            url: `/uploads/documents/${file.filename}`,
            mimeType: file.mimetype,
            type: 'other', // optionally allow client to send actual type
            uploadedAt: new Date()
          }
        })
      )
    );

    res.status(200).json({ message: 'Documents uploaded successfully', savedDocuments });
  } catch (err) {
    console.error('Document upload failed:', err);
    res.status(500).json({ message: 'Document upload failed', error: err });
  }
};