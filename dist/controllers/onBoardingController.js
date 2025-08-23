"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotOnboardedEmployees = exports.deleteOnboarding = exports.updateOnboarding = exports.getOnboardingById = exports.getAllOnboardings = exports.getAllHREmployees = exports.createOnboarding = void 0;
const client_1 = require("@prisma/client");
const Prisma_1 = __importDefault(require("../utils/Prisma"));
const createOnboarding = async (req, res) => {
    try {
        const { employeeId, assignedHRId, startDate, notes, status } = req.body;
        if (!employeeId || !assignedHRId || !startDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // ✅ Check for existing onboarding
        const existing = await Prisma_1.default.onboardingProcess.findUnique({
            where: {
                id: employeeId,
            },
        });
        if (existing) {
            return res.status(400).json({ message: 'This employee is already assigned to an onboarding process.' });
        }
        const onboarding = await Prisma_1.default.onboardingProcess.create({
            data: {
                employeeId,
                assignedHRId,
                startDate: new Date(startDate),
                notes,
                status: status || 'Pending',
            },
        });
        return res.status(201).json(onboarding);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002' &&
            Array.isArray(error.meta?.target) &&
            error.meta.target.includes('employeeId')) {
            return res.status(400).json({ message: 'This employee is already onboarded.' });
        }
        console.error('Error creating onboarding:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createOnboarding = createOnboarding;
const getAllHREmployees = async (req, res) => {
    try {
        const hrEmployees = await Prisma_1.default.employee.findMany({
            where: {
                user: {
                    roleTag: {
                        equals: 'HR'
                    },
                },
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        username: true,
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                department: true,
                subDepartment: true,
            },
        });
        console.log(`[getAllHREmployees] Found ${hrEmployees.length} HR employees`);
        return res.status(200).json(hrEmployees);
    }
    catch (error) {
        console.error('[getAllHREmployees] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllHREmployees = getAllHREmployees;
const getAllOnboardings = async (req, res) => {
    try {
        // ✅ FIXED: getAllOnboardings
        const onboardings = await Prisma_1.default.onboardingProcess.findMany({
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                assignedHR: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                startDate: 'desc',
            },
        });
        return res.status(200).json(onboardings);
    }
    catch (error) {
        console.error('[getAllOnboardings] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllOnboardings = getAllOnboardings;
const getOnboardingById = async (req, res) => {
    try {
        const { id } = req.params;
        const onboarding = await Prisma_1.default.onboardingProcess.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                assignedHR: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        username: true,
                    },
                },
            },
        });
        if (!onboarding) {
            return res.status(404).json({ message: 'Onboarding not found' });
        }
        return res.status(200).json(onboarding);
    }
    catch (error) {
        console.error('[getOnboardingById] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getOnboardingById = getOnboardingById;
const updateOnboarding = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, assignedHRId, startDate, notes, status } = req.body;
        const updated = await Prisma_1.default.onboardingProcess.update({
            where: { id },
            data: {
                employeeId,
                assignedHRId,
                startDate: new Date(startDate),
                notes,
                status,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('[updateOnboarding] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateOnboarding = updateOnboarding;
const deleteOnboarding = async (req, res) => {
    try {
        const { id } = req.params;
        await Prisma_1.default.onboardingProcess.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('[deleteOnboarding] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteOnboarding = deleteOnboarding;
const getNotOnboardedEmployees = async (req, res) => {
    try {
        const onboardedEmployeeIds = await Prisma_1.default.onboardingProcess.findMany({
            select: { employeeId: true },
        });
        const onboardedIds = onboardedEmployeeIds.map(e => e.employeeId);
        const employees = await Prisma_1.default.employee.findMany({
            where: {
                id: { notIn: onboardedIds },
            },
            include: { user: true },
        });
        return res.status(200).json(employees);
    }
    catch (error) {
        console.error('[getNotOnboardedEmployees] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getNotOnboardedEmployees = getNotOnboardedEmployees;
