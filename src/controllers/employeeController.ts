import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { createScopedNotification } from "../utils/notificationUtils";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../utils/Prisma";

enum RoleTag {
  HR = "HR",
  INTERVIEWER = "INTERVIEWER",
  RECRUITER = "RECRUITER",
  TRAINER = "TRAINER",
  FINANCE = "FINANCE",
}

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

export enum EmployeeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  TERMINATED = "terminated",
  RESIGNED = "resigned",
  RETIRED = "retired",
  ON_LEAVE = "onLeave",
  PROBATION = "probation",
}

export const statusOptions = [
  { value: EmployeeStatus.ACTIVE, label: "Active" },
  { value: EmployeeStatus.INACTIVE, label: "Inactive" },
  { value: EmployeeStatus.TERMINATED, label: "Terminated" },
  { value: EmployeeStatus.RESIGNED, label: "Resigned" },
  { value: EmployeeStatus.RETIRED, label: "Retired" },
  { value: EmployeeStatus.ON_LEAVE, label: "On Leave" },
  { value: EmployeeStatus.PROBATION, label: "Probation" },
];
interface CreateEmployeeRequest {
  // User details
  full_name: string;
  email: string;
  phone_number: number;
  password: string;
  gender: string;
  date_of_birth: Date;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;

  role_id: string;
  sub_role_id?: string;
  role_tag?: string;

  // Employee details
  department_id: string;
  //sub_department_id?: string;
  designation: string;
  hire_date: Date;
  status: EmployeeStatus;
  salary: number;

  skills?: string; // Comma-separated string of skills

  work_location: "Onsite" | "Remote" | "Hybrid";
  shift_id: string;

  father_name: string;
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
  const latestEmployee = await prisma.employees.findFirst({
    where: {
      employee_number: {
        startsWith: `EMP${currentYear}`,
      },
    },
    orderBy: {
      employee_number: "desc",
    },
  });

  let sequence = 1;
  if (latestEmployee) {
    // Extract the sequence number from the latest employee number
    const latestSequence = parseInt(latestEmployee.employee_number.slice(-4));
    sequence = latestSequence + 1;
  }

  // Format: EMPYY#### (e.g., EMP240001)
  return `EMP${currentYear}${sequence.toString().padStart(4, "0")}`;
}

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      email,
      phone_number,
      password,
      gender,
      date_of_birth,
      emergency_contact_name,
      emergency_contact_phone,
      address,
      role_id,
      department_id,
      //sub_department_id,
      designation,
      hire_date,
      status,
      salary,
      skills,
      work_location,
      shift_id,
      father_name,
    }: CreateEmployeeRequest = req.body;

    // ✅ Check for existing user by email
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const files = (req.files || {}) as {
      [fieldname: string]: Express.Multer.File[];
    };

    // ✅ Build profile image object if uploaded
    const profileImageObj = files.profileImage?.[0]
      ? [
        {
          name: files.profileImage[0].originalname,
          url: getFileUrl(req, "profiles", files.profileImage[0].filename),
          mime_type: files.profileImage[0].mimetype,
          uploaded_at: new Date(),
        },
      ]
      : [];

    // ✅ Build documents object if uploaded
    const documentsObj =
      files.documents?.map((file) => ({
        name: file.originalname,
        url: getFileUrl(req, "documents", file.filename),
        mime_type: file.mimetype,
        type: file.mimetype,
        uploaded_at: new Date(),
      })) || [];

    // ✅ Validate work location
    if (!["Onsite", "Remote", "Hybrid"].includes(work_location)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid work location. Must be one of: Onsite, Remote, Hybrid",
        received: work_location,
      });
    }

    // ✅ Convert skills from string (FormData sends arrays as strings)
    const processedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim())
        : [];

    // ✅ Generate Employee Number & Hash Password
    const employee_number = await generateEmployeeNumber();
    const password_hash = await bcrypt.hash(password, 10);

    // ✅ Transaction: Create User & Employee
    const result = await prisma.$transaction(async (prismaTx: any) => {
      // Create User
      const newUser = await prismaTx.users.create({
        data: {
          username: email,
          email,
          password_hash,
          full_name,
          role_id,
          status,
          date_joined: new Date(),
        },
      });

      // ✅ Assign subRole permissions
      if (role_id) {
        const subRolePermissions = await prismaTx.role_permissions.findMany({
          where: { role_id },
          select: { permission_id: true },
        });

        if (subRolePermissions.length > 0) {
          await prismaTx.user_permissions.createMany({
            data: subRolePermissions.map((sp: any) => ({
              user_id: newUser.id,
              permission_id: sp.permission_id,
            })),
            skipDuplicates: true,
          });
        }
      }

      const Role = role_id
        ? await prismaTx.roles.findUnique({
          where: { id: role_id },
          select: { name: true },
        })
        : null;

      const designation_name = await prisma.designations.findUnique({
        where: {
          id: designation
        }
      })

      // ✅ Create Employee
      const newEmployee = await prismaTx.employees.create({
        data: {
          user_id: newUser.id,
          phone_number: phone_number ? String(phone_number) : undefined,
          employee_number,
          shift_id,
          department_id: department_id,
          //sub_department_id: sub_department_id,
          // position: designation,
          father_name: father_name ?? undefined,
          date_of_birth: new Date(date_of_birth),
          hire_date: new Date(hire_date),
          status,
          skills: processedSkills.length > 0 ? processedSkills.join(",") : null,
          work_location,
          gender,
          address,
          designation_id: designation_name?.id,
          emergency_contact_name,
          emergency_contact_phone,
          salary,
          images: profileImageObj,
          documents: documentsObj,
          profile_image_url: profileImageObj[0]?.url,
        },
      });

      return { user: newUser, employee: newEmployee };
    });

    try {
      await Promise.all([
        createScopedNotification({
          scope: "ADMIN_ONLY",
          data: {
            title: "New Employee Joined",
            message: `${full_name} has joined the company.`,
            type: "Employee",
          },
          visibilityLevel: 0,
        }),
        createScopedNotification({
          scope: "DIRECTORS_HR",
          data: {
            title: "New Employee Joined",
            message: `${full_name} has joined the company.`,
            type: "Employee",
          },
          visibilityLevel: 1,
        }),
        department_id &&
        createScopedNotification({
          scope: "MANAGERS_DEPT",
          data: {
            title: "New Department Member",
            message: `${full_name} has joined your department.`,
            type: "Employee",
          },
          target_ids: { department_id: department_id, employee_id: result.employee.id },
          visibilityLevel: 2,
          excludeUserId: result.user.id,
        }),
        // sub_department_id &&
        // createScopedNotification({
        //   scope: "TEAMLEADS_SUBDEPT",
        //   data: {
        //     title: "New Team Member",
        //     message: `${full_name} has joined your sub-department.`,
        //     type: "Employee",
        //   },
        //   target_ids: { sub_department_id: sub_department_id, employee_id: result.employee.id },
        //   visibilityLevel: 3,
        //   excludeUserId: result.user.id,
        // }),
        createScopedNotification({
          scope: "EMPLOYEE_ONLY",
          data: {
            title: "Welcome to the Team 🎉",
            message: `Hey ${full_name}, we're excited to have you onboard!`,
            type: "Employee",
          },
          target_ids: { user_id: result.user.id },
          visibilityLevel: 3,
        }),
      ]);
    } catch (err) {
      console.error("Notification error:", err);
    }

    // ✅ Final Response
    return res.status(201).json({
      success: true,
      message: "Employee and user created successfully.",
      data: {
        employee: {
          id: result.employee.id,
          employee_number: result.employee.employee_number,
          full_name,
          email,
          // designation: result.employee.position,
          department: department_id,
          status: result.employee.status,
          skills:
            result.employee.skills?.split(",").map((s: any) => s.trim()) || [],
          work_location: result.employee.work_location,
          gender: result.employee.gender,
          address: result.employee.address,
          emergency_contact: {
            name: result.employee.emergency_contact_name,
            phone: result.employee.emergency_contact_phone,
          },
          salary: result.employee.salary,
          profile_image_url: result.employee.profile_image_url,
          images: result.employee.images || [],
          documents: result.employee.documents || [],
        },
      },
    });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || error,
    });
  }
};

export const listEmployees = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      department,
      status,
      work_location,
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { employee_number: { contains: search as string } },
        // { position: { contains: search as string } },
        { user: { full_name: { contains: search as string } } },
      ];
    }

    if (department) where.department_id = department;
    if (status) where.status = status;
    if (work_location) where.work_location = work_location;

    const total = await prisma.employees.count({ where });

    const employees = await prisma.employees.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            status: true,
            role: { select: { name: true } },
            sub_role: { select: { name: true } },
          },
        },
        designation: true,
        department: { select: { name: true } },
        // sub_department: { select: { name: true } },
        manager: { select: { user: { select: { full_name: true } } } },
      },
      orderBy: { hire_date: "desc" },
    });

    const formattedEmployees = employees.map((emp: any) => {
      // ✅ Parse JSON safely
      const images = Array.isArray(emp.images) ? emp.images : [];
      const documents = Array.isArray(emp.documents) ? emp.documents : [];

      const profile_image_url =
        images.length > 0 &&
          typeof images[0] === "object" &&
          "url" in images[0]!
          ? (images[0] as { url: string }).url
          : emp.profile_image_url || null;

      return {
        id: emp.id,
        employee_number: emp.employee_number,
        full_name: emp.user.full_name,
        email: emp.user.email,
        role: emp.user.role.name,
        sub_role: emp.user.sub_role?.name,
        designation: emp.designation?.name,
        department: emp.department?.name,
        sub_department: emp.sub_department?.name,
        manager: emp.manager?.user.full_name,
        status: emp.status,
        work_location: emp.work_location,
        gender: emp.gender,
        address: emp.address,
        emergency_contact: {
          name: emp.emergency_contact_name,
          phone: emp.emergency_contact_phone,
        },
        salary: emp.salary,
        skills: emp.skills
          ? emp.skills.split(",").map((skill: any) => skill.trim())
          : [],
        hire_date: emp.hire_date,

        // ✅ New fields
        profile_image_url,
        images, // Full image objects
        documents, // Full document objects
      };
    });

    return res.json({
      success: true,
      data: {
        employees: formattedEmployees,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("List employees error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const ListSingleEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // admin isnt related to employee admin - that's why checking for both user and admin
    const employee = await prisma.employees.findFirst({
      where: { OR: [{ id }, { user_id: id }] },
      include: {
        user: true,
        shift: true,
      },
    });

    if (!employee || !employee.user) {
      return res.status(404).json({
        success: false,
        message: "Employee or related user not found",
      });
    }

    // Parse images and documents
    const images = Array.isArray(employee.images) ? employee.images : [];
    const documents = Array.isArray(employee.documents)
      ? employee.documents
      : [];

    const profile_image_url =
      images.length > 0 && typeof images[0] === "object" && "url" in images[0]!
        ? (images[0] as { url: string }).url
        : employee.profile_image_url || null;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: employee.user.id,
          full_name: employee.user.full_name,
          email: employee.user.email,
          role_id: employee.user.role_id,
          sub_role_id: employee.user.sub_role_id,
          status: employee.user.status,
          date_joined: employee.user.date_joined,
        },
        employee: {
          id: employee.id,
          employee_number: employee.employee_number,
          designation: employee.designation_id,
          department_id: employee.department_id,
          phone_number: employee.phone_number,
          sub_department_id: employee.sub_department_id,
          gender: employee.gender,
          father_name: employee.father_name,
          address: employee.address,
          salary: employee.salary,
          shift_id: employee.shift_id,
          shift: employee.shift?.name,
          status: employee.status,
          date_of_birth: employee.date_of_birth,
          hire_date: employee.hire_date,
          skills: employee.skills?.split(",").map((s: any) => s.trim()) || [],
          work_location: employee.work_location,
          emergency_contact_name: employee.emergency_contact_name,
          emergency_contact_phone: employee.emergency_contact_phone,

          // Updated fields
          profile_image_url,
          images,
          documents,
        },
      },
    });
  } catch (error: any) {
    console.error("ListSingleEmployee error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || error,
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch existing employee
    const existingEmployee = await prisma.employees.findUnique({
      where: { id },
    });
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const {
      full_name,
      email,
      phone_number,
      gender,
      date_of_birth,
      emergency_contact_name,
      emergency_contact_phone,
      address,
      role_id,
      department_id,
      designation,
      hire_date,
      status,
      salary,
      skills,
      work_location,
      father_name,
    } = req.body;

    // Handle file uploads
    const files = (req.files || {}) as {
      [fieldname: string]: Express.Multer.File[];
    };

    // Parse existing documents metadata sent by frontend
    let existingDocsFromFrontend: Document[] = [];
    if (req.body.documents_metadata) {
      try {
        existingDocsFromFrontend = JSON.parse(req.body.documents_metadata);
      } catch (err) {
        console.error(
          "Failed to parse documents_metadata:",
          req.body.documents_metadata,
          err
        );
      }
    } else {
      console.log("No existing documents metadata sent from frontend");
    }

    // Build new profile image object if uploaded
    const newProfileImageObj = files.profileImage?.[0]
      ? [
        {
          name: files.profileImage[0].originalname,
          url: getFileUrl(req, "profiles", files.profileImage[0].filename),
          mime_type: files.profileImage[0].mimetype,
          uploaded_at: new Date(),
        },
      ]
      : [];

    // Build new documents object if uploaded
    const newDocumentsObj =
      files.documents?.map((file) => ({
        name: file.originalname,
        url: getFileUrl(req, "documents", file.filename),
        mime_type: file.mimetype,
        type: file.mimetype,
        uploaded_at: new Date(),
      })) || [];

    if (
      work_location &&
      !["Onsite", "Remote", "Hybrid"].includes(work_location)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid work location. Must be one of: Onsite, Remote, Hybrid",
        received: work_location,
      });
    }

    // Process skills array
    const processedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim())
        : [];

    // Merge profile image
    const oldProfileImages = Array.isArray(existingEmployee.images)
      ? existingEmployee.images
      : [];

    const mergedImages =
      newProfileImageObj.length > 0 ? newProfileImageObj : oldProfileImages;
    const firstImage = mergedImages[0];

    const profile_image_url =
      typeof firstImage === "object" &&
        firstImage !== null &&
        "url" in firstImage
        ? (firstImage as { url: string }).url
        : existingEmployee.profile_image_url;

    // Merge documents: only keep those sent from frontend + new uploads
    const mergedDocuments = [...existingDocsFromFrontend, ...newDocumentsObj];

    // Determine subRole type
    const Role = role_id
      ? await prisma.roles.findUnique({
        where: { id: role_id },
        select: { name: true },
      })
      : null;

    // Update employee
    const updatedEmployee = await prisma.employees.update({
      where: { id },
      data: {
        phone_number,
        department: { connect: { id: department_id } },
        designation: {
          connect: { id: designation }
        },
        father_name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        hire_date: hire_date ? new Date(hire_date) : undefined,
        status,
        skills: processedSkills.length > 0 ? processedSkills.join(",") : null,
        work_location,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        salary: salary ? Number(salary) : undefined,
        profile_image_url,
        images:
          mergedImages.length > 0
            ? JSON.parse(JSON.stringify(mergedImages))
            : null,
        documents:
          mergedDocuments.length > 0
            ? JSON.parse(JSON.stringify(mergedDocuments))
            : null,
      },
    });

    // Update user info
    const updateUserData: any = {};
    if (email) updateUserData.email = email;
    if (full_name) updateUserData.full_name = full_name;
    if (role_id) updateUserData.role_id = role_id;
    if (role_id) updateUserData.role_id = role_id;

    if (Object.keys(updateUserData).length > 0) {
      await prisma.users.update({
        where: { id: updatedEmployee.user_id },
        data: updateUserData,
      });
    }

    // Send notifications
    try {
      const performedBy = req.user as unknown as CustomJwtPayload;
      const performer = await prisma.users.findUnique({
        where: { id: performedBy.userId },
      });
      const updatedUser = await prisma.users.findUnique({
        where: { id: updatedEmployee.user_id },
      });

      const performerName = performer?.full_name ?? "Someone";
      const employeeName = full_name || updatedUser?.full_name || "An employee";

      await Promise.all([
        createScopedNotification({
          scope: "ADMIN_ONLY",
          data: {
            title: "Employee Info Updated",
            message: `${employeeName}'s info was updated by ${performerName}.`,
            type: "Employee",
          },
          visibilityLevel: 0,
        }),
        createScopedNotification({
          scope: "DIRECTORS_HR",
          data: {
            title: "Employee Info Updated",
            message: `${employeeName}'s profile was updated.`,
            type: "Employee",
          },
          visibilityLevel: 1,
        }),
        createScopedNotification({
          scope: "EMPLOYEE_ONLY",
          data: {
            title: "Your Info Was Updated",
            message: `Your profile was updated. Please verify the changes.`,
            type: "Employee",
          },
          target_ids: { user_id: updatedEmployee.user_id },
          visibilityLevel: 3,
        }),
      ]);
    } catch (err) {
      console.error("Notification error after updateEmployee:", err);
    }

    // Return updated employee
    return res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      data: {
        employee: {
          id: updatedEmployee.id,
          employee_number: updatedEmployee.employee_number,
          full_name: full_name || undefined,
          email: email || undefined,
          designation: updatedEmployee.designation_id,
          department: department_id,
          status: updatedEmployee.status,
          skills:
            updatedEmployee.skills?.split(",").map((s: any) => s.trim()) || [],
          work_location: updatedEmployee.work_location,
          gender: updatedEmployee.gender,
          address: updatedEmployee.address,
          emergency_contact: {
            name: updatedEmployee.emergency_contact_name,
            phone: updatedEmployee.emergency_contact_phone,
          },
          salary: updatedEmployee.salary,
          profile_image_url: updatedEmployee.profile_image_url,
          images: updatedEmployee.images || [],
          documents: updatedEmployee.documents || [],
        },
      },
    });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error?.message || error,
    });
  }
};

// export const deleteEmployee = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   try {
//     const employee = await prisma.employee.findUnique({
//       where: { id },
//       include: { user: true }
//     });

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: 'Employee not found'
//       });
//     }

//     await prisma.$transaction(async (tx) => {
//       await tx.employee.delete({ where: { id } });

//       if (employee.userId) {
//         await tx.user.update({
//           where: { id: employee.userId },
//           data: { status: 'inactive' }
//         });
//       }
//     });

//     // 👇 Notifications
//     try {
//       const performedBy = req.user as unknown as CustomJwtPayload;
//       const performer = await prisma.user.findUnique({ where: { id: performedBy.userId } });

//       const performerName = performer?.fullName ?? 'Someone';
//       const employeeName = employee.user?.fullName || 'An employee';

//       await Promise.all([
//         createScopedNotification({
//           scope: 'ADMIN_ONLY',
//           data: {
//             title: 'Employee Deleted',
//             message: `${employeeName} was removed by ${performerName}.`,
//             type: 'Employee'
//           },
//           visibilityLevel: 0,
//           showPopup: true
//         }),
//         createScopedNotification({
//           scope: 'DIRECTORS_HR',
//           data: {
//             title: 'Employee Removed',
//             message: `${employeeName} was removed from the company.`,
//             type: 'Employee'
//           },
//           visibilityLevel: 1,
//           showPopup: true
//         }),
//         employee.departmentId &&
//         createScopedNotification({
//           scope: 'MANAGERS_DEPT',
//           data: {
//             title: 'Team Member Removed',
//             message: `${employeeName} was removed from your department.`,
//             type: 'Employee'
//           },
//           targetIds: { departmentId: employee.departmentId },
//           visibilityLevel: 2,
//           excludeUserId: employee.userId,
//           showPopup: true
//         }),
//         employee.subDepartmentId &&
//         createScopedNotification({
//           scope: 'TEAMLEADS_SUBDEPT',
//           data: {
//             title: 'Team Member Removed',
//             message: `${employeeName} was removed from your sub-department.`,
//             type: 'Employee'
//           },
//           targetIds: { subDepartmentId: employee.subDepartmentId },
//           visibilityLevel: 3,
//           excludeUserId: employee.userId,
//           showPopup: true
//         })
//       ]);
//     } catch (err) {
//       console.error('Notification error after deleteEmployee:', err);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Employee deleted and user marked as inactive successfully'
//     });

//   } catch (error) {
//     console.error('Delete employee error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// GET /users/inactive

export const listInactiveUsers = async (req: Request, res: Response) => {
  try {
    const inactiveUsers = await prisma.users.findMany({
      where: { status: "inactive" },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        role_id: true,
        status: true,
        date_joined: true,
      },
      orderBy: { full_name: "asc" },
    });

    return res.json({
      success: true,
      data: {
        users: inactiveUsers,
      },
    });
  } catch (error) {
    console.error("List inactive users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete user only if linked employee is deleted
// export const deleteUser = async (req: Request, res: Response) => {
//   const userId = req.params.userId;

//   try {
//     // Check if employee linked to user exists
//     const employee = await prisma.employee.findUnique({ where: { userId } });

//     if (employee) {
//       return res.status(400).json({
//         message: "Cannot delete user while linked employee exists."
//       });
//     }

//     // Delete related data in dependent order

//     await prisma.userNotification.deleteMany({ where: { userId } });
//     await prisma.userPermission.deleteMany({ where: { userId } });
//     await prisma.systemLog.deleteMany({ where: { userId } });
//     await prisma.bulkUpload.deleteMany({ where: { uploadedById: userId } });
//     await prisma.leaveRequest.deleteMany({ where: { approvedById: userId } });
//     await prisma.vacation.deleteMany({ where: { approvedById: userId } });
//     await prisma.onboardingProcess.deleteMany({ where: { assignedHRId: userId } });
//     await prisma.hRProcess.deleteMany({ where: { initiatedById: userId } });

//     // Resignation has two fields referencing User, delete by both
//     await prisma.resignation.deleteMany({ where: { processedById: userId } });
//     await prisma.resignation.deleteMany({ where: { clearanceResponsibleId: userId } });

//     await prisma.notification.deleteMany({ where: { userId } });
//     await prisma.attendanceFixRequest.deleteMany({ where: { reviewedById: userId } });

//     // Finally, delete the user
//     await prisma.user.delete({ where: { id: userId } });

//     res.json({ message: "User and all related data deleted successfully." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error while deleting user." });
//   }
// };

// Helper to generate file URL

const getFileUrl = (req: Request, folder: string, filename: string) => {
  const baseUrl =
    process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

// info updated by employee himself - phone / email / profileImage only
export const updateEmployeeInfoByEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, phone_number } = req.body;
    const user_id = req.user?.userId;

    const files = (req.files || {}) as {
      [fieldname: string]: Express.Multer.File[];
    };

    // Build new image objects
    let newImages: any[] = [];
    if (files?.profileImage?.length) {
      newImages = files.profileImage.map((file) => ({
        name: file.originalname,
        url: getFileUrl(req, "profiles", file.filename),
        mime_type: file.mimetype,
        uploaded_at: new Date(),
      }));
    }

    // Fetch existing employee
    const existingEmployee = await prisma.employees.findUnique({
      where: { user_id },
    });
    if (!existingEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Merge images (replace old with new if uploaded)
    const finalImages: any[] =
      newImages.length > 0
        ? newImages
        : Array.isArray(existingEmployee.images)
          ? existingEmployee.images
          : [];
    // Profile URL: first image or existing
    const profile_image_url: string | undefined =
      newImages.length > 0
        ? newImages[0].url
        : existingEmployee.profile_image_url || undefined;

    if (!email && !phone_number && newImages.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update." });
    }

    // Update employee
    const updatedEmployee = await prisma.employees.update({
      where: { user_id },
      data: {
        phone_number: phone_number || undefined,
        profile_image_url,
        images:
          finalImages.length > 0
            ? JSON.parse(JSON.stringify(finalImages))
            : null,
      },
    });

    // Update user email
    if (email) {
      await prisma.users.update({
        where: { id: user_id },
        data: { email },
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        email: email || undefined,
        phone_number: updatedEmployee.phone_number,
        profile_image_url: updatedEmployee.profile_image_url || undefined,
        images: updatedEmployee.images || [],
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};