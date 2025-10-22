import { Request, Response } from 'express';
import prisma from '../utils/Prisma';
import { connect } from 'http2';

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

        const empId = await prisma.employees.findUnique({
            where: {
                user_id: req.user?.userId
            }
        })

        const files = (req.files || {}) as {
            [fieldname: string]: Express.Multer.File[];
        };

        const user_id = req.user?.userId


        const documentsObj =
            files.documents?.map((file) => ({
                name: file.originalname,
                url: getFileUrl(req, "documents", file.filename),
                mime_type: file.mimetype,
                type: file.mimetype,
                uploaded_at: new Date(),
            })) || [];


        const upwork_profile_id = await prisma.upwork_ids.findUnique({
            where: { id: upwork_id }
        })

        if (!upwork_profile_id) {
            return res.status(400).json({ success: false, message: "Provided upwork ID does not exist." })
        }

        const lastProject = await prisma.projects.findFirst({
            orderBy: { auto_id: 'desc' },
            select: { auto_id: true },
        });

        const nextAutoId = (lastProject?.auto_id ?? 0) + 1;

        const newProject = await prisma.projects.create({
            data: {
                client_name,
                name,
                auto_id: nextAutoId,
                upwork_profile: {
                    connect: { id: upwork_profile_id.id }
                },
                description,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                number_of_hours: Number(number_of_hours),
                status,
                sales_person: {
                    connect: { id: sales_person_id }
                },
                assignee: {
                    connect: { id: assignee_id }
                },
                documents: documentsObj,
                created_by: user_id
            },
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully.",
            newProject
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Get all projects
export const get_all_projects = async (req: Request, res: Response) => {
    try {

        const projects = await prisma.projects.findMany({
            include: {
                sales_person: {
                    include: {
                        user: true
                    }
                },
                assignee: {
                    include: {
                        user: true
                    }
                },
                bid: true,
                milestones: true,
            },
            orderBy: { created_at: "desc" }

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
                sales_person: {
                    select: { id: true, user: true }
                },
                assignee: {
                    select: { id: true, user: true }
                },
                bid: true,
                milestones: true
            },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
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

        const empId = await prisma.employees.findUnique({
            where: {
                user_id: req.user?.userId
            }
        })

        const upwork_profile = await prisma.upwork_ids.findUnique({
            where: { id: upwork_id }
        })

        if (!upwork_profile) {
            return res.status(400).json({ success: false, message: "Provided upwork ID does not exist." })
        }

        const updatedProject = await prisma.projects.update({
            where: { id },
            data: {
                client_name,
                upwork_id: upwork_profile.id,
                name,
                description,
                start_date: start_date ? new Date(start_date) : undefined,
                end_date: end_date ? new Date(end_date) : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                status,
                sales_person: sales_person_id,
                assignee: assignee_id,
                number_of_hours,
                bid: bid_id,
                updated_by: empId?.id
            },
        });

        res.status(200).json(updatedProject);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a project by ID
export const delete_project = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const empId = await prisma.employees.findUnique({
            where: {
                user_id: req.user?.userId
            }
        })

        if (empId) {
            await prisma.projects.update({
                where: { id },
                data: {
                    status: "deleted",
                    updated_by: empId.id
                }
            });
            res.status(204).json({ message: "Deletion Successful" }); // No content
        } else {
            res.status(404).json({ message: "Employee ID not found - you must have a valid employee Id to delete this project" })
        }
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Create project type
export const create_project_type = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        const project_type = await prisma.project_types.findFirst({ where: { name } })

        if (project_type) {
            return res.status(400).json({ success: false, message: "A project type with similar name exists, please use some other name" })
        } else {
            const type = await prisma.project_types.create({
                data: {
                    name,
                    created_by: req.user?.userId
                }
            })
            res.status(200).json({ success: true, type, message: "New Project type created" })
        }
    } catch (error) {
        console.error("Error creating new project type", error)
    }
}

export const get_all_project_types = async (req: Request, res: Response) => {
    try {
        const project_types = await prisma.project_types.findMany({})

        return res.status(200).json({ success: true, message: "All project types fetched successfully", project_types })
    } catch (error) {
        console.error("Error fetching project types:", error)
        return res.status(500).json({ success: false, message: "Server error while fetching project types" })
    }
}