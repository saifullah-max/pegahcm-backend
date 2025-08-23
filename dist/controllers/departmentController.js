"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.getDepartmentById = exports.getAllDepartments = exports.createDepartment = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
// Create a new department
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }
        // Check if department with same name exists
        const existingDepartment = await Prisma_1.default.department.findUnique({
            where: { name }
        });
        if (existingDepartment) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name already exists'
            });
        }
        const department = await Prisma_1.default.department.create({
            data: {
                name,
                description
            }
        });
        res.status(201).json({
            success: true,
            data: department
        });
    }
    catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create department'
        });
    }
};
exports.createDepartment = createDepartment;
// Get all departments
const getAllDepartments = async (req, res) => {
    try {
        const departments = await Prisma_1.default.department.findMany({
            include: {
                subDepartments: true
            }
        });
        res.json({
            success: true,
            data: departments
        });
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments'
        });
    }
};
exports.getAllDepartments = getAllDepartments;
// Get department by ID
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Prisma_1.default.department.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch department'
        });
    }
};
exports.getDepartmentById = getDepartmentById;
// Update department
const updateDepartment = async (req, res) => {
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
        const existingDepartment = await Prisma_1.default.department.findUnique({
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
            const nameConflict = await Prisma_1.default.department.findUnique({
                where: { name }
            });
            if (nameConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'Department with this name already exists'
                });
            }
        }
        const updatedDepartment = await Prisma_1.default.department.update({
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
    }
    catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update department'
        });
    }
};
exports.updateDepartment = updateDepartment;
// Delete department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if department exists
        const department = await Prisma_1.default.department.findUnique({
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
        await Prisma_1.default.department.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete department'
        });
    }
};
exports.deleteDepartment = deleteDepartment;
