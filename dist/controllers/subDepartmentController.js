"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubDepartment = exports.updateSubDepartment = exports.getSubDepartmentById = exports.getAllSubDepartments = exports.createSubDepartment = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
// Create a new sub-department
const createSubDepartment = async (req, res) => {
    try {
        const { name, description, departmentId } = req.body;
        if (!name || !departmentId) {
            return res.status(400).json({
                success: false,
                message: 'Sub-department name and department ID are required'
            });
        }
        // Check if department exists
        const department = await Prisma_1.default.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Check if sub-department with same name exists
        const existingSubDepartment = await Prisma_1.default.subDepartment.findUnique({
            where: { name }
        });
        if (existingSubDepartment) {
            return res.status(400).json({
                success: false,
                message: 'Sub-department with this name already exists'
            });
        }
        const subDepartment = await Prisma_1.default.subDepartment.create({
            data: {
                name,
                description,
                departmentId
            }
        });
        const getAllSubDepartments = await Prisma_1.default.subDepartment.findMany({});
        console.log("All sub dept:", getAllSubDepartments);
        res.status(201).json({
            success: true,
            data: getAllSubDepartments
        });
    }
    catch (error) {
        console.error('Error creating sub-department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sub-department'
        });
    }
};
exports.createSubDepartment = createSubDepartment;
// Get all sub-departments
const getAllSubDepartments = async (req, res) => {
    try {
        const subDepartments = await Prisma_1.default.subDepartment.findMany({
            include: {
                department: true,
                employees: true
            }
        });
        res.json({
            success: true,
            data: subDepartments
        });
    }
    catch (error) {
        console.error('Error fetching sub-departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-departments'
        });
    }
};
exports.getAllSubDepartments = getAllSubDepartments;
// Get sub-department by ID
const getSubDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const subDepartment = await Prisma_1.default.subDepartment.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching sub-department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-department'
        });
    }
};
exports.getSubDepartmentById = getSubDepartmentById;
// Update sub-department
const updateSubDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, departmentId } = req.body;
        if (!name || !departmentId) {
            return res.status(400).json({
                success: false,
                message: 'Sub-department name and department ID are required'
            });
        }
        // Check if sub-department exists
        const existingSubDepartment = await Prisma_1.default.subDepartment.findUnique({
            where: { id }
        });
        if (!existingSubDepartment) {
            return res.status(404).json({
                success: false,
                message: 'Sub-department not found'
            });
        }
        // Check if department exists
        const department = await Prisma_1.default.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        // Check if new name conflicts with other sub-departments
        if (name !== existingSubDepartment.name) {
            const nameConflict = await Prisma_1.default.subDepartment.findUnique({
                where: { name }
            });
            if (nameConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'Sub-department with this name already exists'
                });
            }
        }
        const updatedSubDepartment = await Prisma_1.default.subDepartment.update({
            where: { id },
            data: {
                name,
                description,
                departmentId
            }
        });
        res.json({
            success: true,
            data: updatedSubDepartment
        });
    }
    catch (error) {
        console.error('Error updating sub-department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update sub-department'
        });
    }
};
exports.updateSubDepartment = updateSubDepartment;
// Delete sub-department
const deleteSubDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if sub-department exists
        const subDepartment = await Prisma_1.default.subDepartment.findUnique({
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
        await Prisma_1.default.subDepartment.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting sub-department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete sub-department'
        });
    }
};
exports.deleteSubDepartment = deleteSubDepartment;
