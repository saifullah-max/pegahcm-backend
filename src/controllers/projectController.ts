import { Request, Response } from "express";
import prisma from "../utils/Prisma";
import { connect } from "http2";
import { buildFilters } from "../utils/buildFilters";
import { CustomJwtPayload } from "./notificationController";

export const getFileUrl = (req: Request, folder: string, filename: string) => {
  const baseUrl =
    process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

export const create_project = async (req: Request, res: Response) => {
  try {
    const {
      client_name,
      name,
      upwork_id,
      description,
      start_date,
      end_date,
      deadline,
      number_of_hours,
      sales_person_id,
      assignee_id,
      status,
      bid_id,
    } = req.body;

    const user_id = req.user?.userId;

    // Process files
    const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };
    const documentsObj = files.documents?.map(file => ({
      name: file.originalname,
      url: getFileUrl(req, "documents", file.filename),
      mime_type: file.mimetype,
      type: file.mimetype,
      uploaded_at: new Date(),
    })) || [];

    // Validate upwork ID
    const upworkProfile = await prisma.upwork_ids.findUnique({ where: { id: upwork_id } });
    if (!upworkProfile) {
      return res.status(400).json({ success: false, message: "Provided upwork ID does not exist." });
    }

    // Prepare auto_id
    const lastProject = await prisma.projects.findFirst({
      orderBy: { auto_id: "desc" },
      select: { auto_id: true },
    });
    const nextAutoId = (lastProject?.auto_id ?? 0) + 1;

    // Prepare employee IDs arrays
    const assigneeIdsArray: string[] = Array.isArray(assignee_id)
      ? assignee_id
      : assignee_id
        ? assignee_id.split(",").map((id: string) => id.trim())
        : [];

    const salesPersonIdsArray: string[] = Array.isArray(sales_person_id)
      ? sales_person_id
      : sales_person_id
        ? sales_person_id.split(",").map((id: string) => id.trim())
        : [];

    // Fetch only existing employees
    const existingAssignees = assigneeIdsArray.length
      ? await prisma.employees.findMany({ where: { id: { in: assigneeIdsArray } } })
      : [];
    const existingSalesPersons = salesPersonIdsArray.length
      ? await prisma.employees.findMany({ where: { id: { in: salesPersonIdsArray } } })
      : [];

    // Create project
    const newProject = await prisma.projects.create({
      data: {
        client_name,
        name,
        auto_id: nextAutoId,
        upwork_profile: { connect: { id: upworkProfile.id } },
        description,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        number_of_hours: Number(number_of_hours),
        status,
        assignees: existingAssignees.length
          ? { connect: existingAssignees.map(emp => ({ id: emp.id })) }
          : undefined,
        sales_persons: existingSalesPersons.length
          ? { connect: existingSalesPersons.map(emp => ({ id: emp.id })) }
          : undefined,
        documents: documentsObj,
        created_by: user_id,
        bid: {
          connect: { id: bid_id }
        }
      },
    });

    res.status(201).json({ success: true, message: "Project created successfully.", newProject });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// Get all projects
export const get_all_projects = async (req: Request, res: Response) => {
  try {
    const current_user_id = (req.user as unknown as CustomJwtPayload).userId;
    const permissionScope = (req as any).permissionScope || "all"; // 'own' | 'all'
    const baseWhere = (buildFilters("projects", req.query) || {}) as any;

    let where: any = baseWhere;
    if (permissionScope === "own") {
      const ownerFilter = {
        OR: [{ created_by: current_user_id }],
      };
      if (Object.keys(baseWhere).length === 0) {
        where = ownerFilter;
      } else {
        where = { AND: [baseWhere, ownerFilter] };
      }
    }

    const projects = await prisma.projects.findMany({
      where,
      include: {
        sales_persons: {
          include: {
            user: true,
          },
        },
        assignees: {
          include: {
            user: true,
          },
        },
        bid: true,
        milestones: true,
      },
      orderBy: { created_at: "desc" },
    });
    res.status(200).json(projects);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single project by ID
export const get_project_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        sales_persons: {
          select: { id: true, user: true },
        },
        assignees: {
          select: { id: true, user: true },
        },
        bid: true,
        milestones: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Update a project by ID
export const update_project = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      client_name,
      name,
      upwork_id,
      description,
      start_date,
      end_date,
      deadline,
      number_of_hours,
      sales_person_id,
      assignee_id,
      status,
      bid_id,
    } = req.body;

    const user_id = req.user?.userId;

    // Process files (if any uploaded)
    const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };
    const documentsObj =
      files.documents?.map((file) => ({
        name: file.originalname,
        url: getFileUrl(req, "documents", file.filename),
        mime_type: file.mimetype,
        type: file.mimetype,
        uploaded_at: new Date(),
      })) || [];

    // Validate project existence
    const existingProject = await prisma.projects.findUnique({ where: { id } });
    if (!existingProject) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Validate Upwork profile
    const upworkProfile = await prisma.upwork_ids.findUnique({ where: { id: upwork_id } });
    if (!upworkProfile) {
      return res.status(400).json({
        success: false,
        message: "Provided upwork ID does not exist.",
      });
    }

    // Prepare employee arrays
    const assigneeIdsArray: string[] = Array.isArray(assignee_id)
      ? assignee_id
      : assignee_id
        ? assignee_id.split(",").map((id: string) => id.trim())
        : [];

    const salesPersonIdsArray: string[] = Array.isArray(sales_person_id)
      ? sales_person_id
      : sales_person_id
        ? sales_person_id.split(",").map((id: string) => id.trim())
        : [];

    // Fetch only existing employees
    const existingAssignees = assigneeIdsArray.length
      ? await prisma.employees.findMany({ where: { id: { in: assigneeIdsArray } } })
      : [];
    const existingSalesPersons = salesPersonIdsArray.length
      ? await prisma.employees.findMany({ where: { id: { in: salesPersonIdsArray } } })
      : [];

    // Merge old and new documents (if needed)
    const updatedDocuments = [
      ...(Array.isArray(existingProject.documents) ? existingProject.documents : []),
      ...documentsObj,
    ];

    // Update project
    const updatedProject = await prisma.projects.update({
      where: { id },
      data: {
        client_name,
        name,
        description,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        number_of_hours: Number(number_of_hours),
        status,
        upwork_profile: { connect: { id: upworkProfile.id } },
        bid: bid_id ? { connect: { id: bid_id } } : undefined,
        documents: updatedDocuments,
        assignees: existingAssignees.length
          ? { set: existingAssignees.map((emp) => ({ id: emp.id })) }
          : { set: [] },
        sales_persons: existingSalesPersons.length
          ? { set: existingSalesPersons.map((emp) => ({ id: emp.id })) }
          : { set: [] },
        updated_by: user_id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      updatedProject,
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Failed to update project.",
      error: error.message,
    });
  }
};

// Delete a project by ID
export const delete_project = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const empId = await prisma.employees.findUnique({
      where: {
        user_id: req.user?.userId,
      },
    });

    if (empId) {
      await prisma.projects.update({
        where: { id },
        data: {
          status: "deleted",
          updated_by: empId.id,
        },
      });
      res.status(204).json({ message: "Deletion Successful" }); // No content
    } else {
      res.status(404).json({
        message:
          "Employee ID not found - you must have a valid employee Id to delete this project",
      });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Create project type
export const create_project_type = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const project_type = await prisma.project_types.findFirst({
      where: { name },
    });

    if (project_type) {
      return res.status(400).json({
        success: false,
        message:
          "A project type with similar name exists, please use some other name",
      });
    } else {
      const type = await prisma.project_types.create({
        data: {
          name,
          created_by: req.user?.userId,
        },
      });
      res
        .status(200)
        .json({ success: true, type, message: "New Project type created" });
    }
  } catch (error) {
    console.error("Error creating new project type", error);
  }
};

export const get_all_project_types = async (req: Request, res: Response) => {
  try {
    const project_types = await prisma.project_types.findMany({});

    return res.status(200).json({
      success: true,
      message: "All project types fetched successfully",
      project_types,
    });
  } catch (error) {
    console.error("Error fetching project types:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching project types",
    });
  }
};
