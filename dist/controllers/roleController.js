"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.getRoleById = exports.getRoles = exports.createRole = void 0;
const Prisma_1 = __importDefault(require("../utils/Prisma"));
// Create a new role
const createRole = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Role name is required'
            });
        }
        const role = await Prisma_1.default.role.create({
            data: {
                name,
                description
            }
        });
        return res.status(201).json({
            success: true,
            data: role
        });
    }
    catch (error) {
        console.error('Create role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createRole = createRole;
// Get all roles
const getRoles = async (req, res) => {
    try {
        const roles = await Prisma_1.default.role.findMany();
        return res.status(200).json({
            success: true,
            data: roles
        });
    }
    catch (error) {
        console.error('Get roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getRoles = getRoles;
// Get role by ID
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Prisma_1.default.role.findUnique({
            where: { id }
        });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: role
        });
    }
    catch (error) {
        console.error('Get role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getRoleById = getRoleById;
// Update role
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Role name is required'
            });
        }
        const role = await Prisma_1.default.role.update({
            where: { id },
            data: {
                name,
                description
            }
        });
        return res.status(200).json({
            success: true,
            data: role
        });
    }
    catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateRole = updateRole;
// Delete role
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if role is being used by any users
        const usersWithRole = await Prisma_1.default.user.findFirst({
            where: { roleId: id }
        });
        if (usersWithRole) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete role that is assigned to users'
            });
        }
        await Prisma_1.default.role.delete({
            where: { id }
        });
        return res.status(200).json({
            success: true,
            message: 'Role deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteRole = deleteRole;
