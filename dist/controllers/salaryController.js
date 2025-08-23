"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalarySlip = exports.copyPreviousSalaryByEmployee = exports.getMySalary = exports.getSalaryById = exports.getAllSalaries = exports.deleteSalary = exports.updateSalary = exports.createSalary = exports.calculateTotalSalary = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const Prisma_1 = __importDefault(require("../utils/Prisma"));
// Helper to calculate total salary
const calculateTotalSalary = (baseSalary, allowances, deductions, bonuses) => {
    return baseSalary + allowances + bonuses - deductions;
};
exports.calculateTotalSalary = calculateTotalSalary;
// Create salary
const createSalary = async (req, res) => {
    try {
        const { employeeId, baseSalary, deductions, bonuses, allowances, effectiveFrom, effectiveTo } = req.body;
        console.log("Employee ID:", employeeId);
        if (!employeeId) {
            return res.status(400).json({ error: "employeeId is required" });
        }
        const createdSalary = await Prisma_1.default.salaryDetail.create({
            data: {
                employeeId,
                baseSalary,
                deductions,
                bonuses,
                totalPay: 0, // will update after allowances
                effectiveFrom,
                effectiveTo,
                createdBy: req.user?.userId || 'system',
            }
        });
        if (allowances && allowances.length > 0) {
            await Prisma_1.default.allowance.createMany({
                data: allowances.map((a) => ({
                    salaryId: createdSalary.id,
                    type: a.type,
                    amount: Number(a.amount) || 0
                }))
            });
        }
        // Calculate total
        const totalAllowances = allowances?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
        const totalPay = Number(baseSalary) + totalAllowances + Number(bonuses) - Number(deductions);
        await Prisma_1.default.salaryDetail.update({
            where: { id: createdSalary.id },
            data: { totalPay }
        });
        res.status(201).json({ success: true, data: { ...createdSalary, totalPay } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating salary', error });
    }
};
exports.createSalary = createSalary;
// Update salary
const updateSalary = async (req, res) => {
    try {
        const { id } = req.params;
        const { baseSalary, deductions, bonuses, allowances, effectiveFrom, effectiveTo } = req.body;
        // 1️⃣ Fetch existing salary
        const existingSalary = await Prisma_1.default.salaryDetail.findUnique({
            where: { id },
            include: { allowances: true }
        });
        if (!existingSalary) {
            return res.status(404).json({ success: false, message: 'Salary record not found' });
        }
        // 2️⃣ Update basic salary fields
        const updatedSalary = await Prisma_1.default.salaryDetail.update({
            where: { id },
            data: {
                baseSalary: baseSalary !== undefined ? Number(baseSalary) : existingSalary.baseSalary,
                deductions: deductions !== undefined ? Number(deductions) : existingSalary.deductions,
                bonuses: bonuses !== undefined ? Number(bonuses) : existingSalary.bonuses,
                effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : existingSalary.effectiveFrom,
                effectiveTo: effectiveTo ? new Date(effectiveTo) : existingSalary.effectiveTo,
                updatedBy: req.user?.userId || existingSalary.updatedBy
            }
        });
        // 3️⃣ If allowances are provided, replace them
        if (Array.isArray(allowances)) {
            // Delete old allowances
            await Prisma_1.default.allowance.deleteMany({ where: { salaryId: id } });
            // Insert new ones
            if (allowances.length > 0) {
                await Prisma_1.default.allowance.createMany({
                    data: allowances.map((a) => ({
                        salaryId: id,
                        type: a.type,
                        amount: Number(a.amount) || 0
                    }))
                });
            }
        }
        // 4️⃣ Recalculate totalPay
        const updatedAllowances = await Prisma_1.default.allowance.findMany({ where: { salaryId: id } });
        const totalAllowances = updatedAllowances.reduce((sum, a) => sum + Number(a.amount), 0);
        const totalPay = Number(updatedSalary.baseSalary) + totalAllowances + Number(updatedSalary.bonuses) - Number(updatedSalary.deductions);
        await Prisma_1.default.salaryDetail.update({
            where: { id },
            data: { totalPay }
        });
        // 5️⃣ Return updated record with allowances
        const finalRecord = await Prisma_1.default.salaryDetail.findUnique({
            where: { id },
            include: { allowances: true }
        });
        res.json({ success: true, data: finalRecord });
    }
    catch (error) {
        console.error("Error updating salary:", error);
        res.status(500).json({ success: false, message: 'Error updating salary', error });
    }
};
exports.updateSalary = updateSalary;
// Delete salary
const deleteSalary = async (req, res) => {
    try {
        const { id } = req.params;
        await Prisma_1.default.salaryDetail.delete({ where: { id } });
        res.json({ success: true, message: 'Salary deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting salary', error });
    }
};
exports.deleteSalary = deleteSalary;
// Get all salaries
const getAllSalaries = async (req, res) => {
    try {
        const salaries = await Prisma_1.default.salaryDetail.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        position: true,
                        user: { select: { fullName: true, email: true } },
                    },
                },
                allowances: true, // 👈 Add this
            },
        });
        res.json({ success: true, data: salaries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salaries', error });
    }
};
exports.getAllSalaries = getAllSalaries;
// Get single salary
const getSalaryById = async (req, res) => {
    try {
        const { id } = req.params;
        const salary = await Prisma_1.default.salaryDetail.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        position: true,
                        user: { select: { fullName: true, email: true } },
                    },
                },
                allowances: true, // 👈 Add this
            },
        });
        res.json({ success: true, data: salary });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary', error });
    }
};
exports.getSalaryById = getSalaryById;
// Get own salary
const getMySalary = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const employee = await Prisma_1.default.employee.findUnique({
            where: { userId },
            include: {
                salaryDetails: {
                    include: {
                        allowances: true
                    }
                }
            }
        });
        res.json({ success: true, data: employee?.salaryDetails || [] });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary', error });
    }
};
exports.getMySalary = getMySalary;
// incase of no change for next month salary
const copyPreviousSalaryByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId)
            return res.status(400).json({ success: false, message: 'employeeId is required' });
        // Optionally verify user permission here if needed
        // Find latest salary for the given employeeId
        const latestSalary = await Prisma_1.default.salaryDetail.findFirst({
            where: { employeeId },
            orderBy: { effectiveFrom: 'desc' },
            include: { allowances: true },
        });
        if (!latestSalary) {
            return res.status(404).json({ success: false, message: 'No previous salary found to copy' });
        }
        // Calculate next month dates
        const nextEffectiveFrom = new Date(latestSalary.effectiveFrom);
        nextEffectiveFrom.setMonth(nextEffectiveFrom.getMonth() + 1);
        let nextEffectiveTo = null;
        if (latestSalary.effectiveTo) {
            nextEffectiveTo = new Date(latestSalary.effectiveTo);
            nextEffectiveTo.setMonth(nextEffectiveTo.getMonth() + 1);
        }
        // Create new salary with same amounts and allowances but updated dates
        const newSalary = await Prisma_1.default.salaryDetail.create({
            data: {
                employeeId,
                baseSalary: latestSalary.baseSalary,
                deductions: latestSalary.deductions,
                bonuses: latestSalary.bonuses,
                effectiveFrom: nextEffectiveFrom,
                effectiveTo: nextEffectiveTo,
                createdBy: req.user?.userId || 'system',
                totalPay: latestSalary.totalPay,
                allowances: {
                    create: latestSalary.allowances.map((a) => ({
                        type: a.type,
                        amount: a.amount,
                    })),
                },
            },
            include: { allowances: true },
        });
        res.status(201).json({ success: true, data: newSalary });
    }
    catch (error) {
        console.error('Error copying salary:', error);
        res.status(500).json({ success: false, message: 'Error copying salary', error });
    }
};
exports.copyPreviousSalaryByEmployee = copyPreviousSalaryByEmployee;
/**
 * GET /api/payslip/download/:employeeId?month=YYYY-MM
 * Returns a password-protected PDF of the employee's payslip
 */
const getSalarySlip = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { month } = req.query; // optional month filter
        // Fetch employee details including user info
        const employee = await Prisma_1.default.employee.findUnique({
            where: { id: employeeId },
            include: { user: true, department: true, subDepartment: true, salaryDetails: { include: { allowances: true } } }
        });
        if (!employee)
            return res.status(404).send('Employee not found');
        console.log("Available salary months:", employee.salaryDetails.map((s) => s.effectiveFrom));
        // Determine salary for requested month or latest
        let salary;
        if (month) {
            const [year, mon] = month.split('-').map(Number);
            salary = employee.salaryDetails.find((s) => s.effectiveFrom.getFullYear() === year && s.effectiveFrom.getMonth() + 1 === mon);
        }
        if (!salary) {
            salary = employee.salaryDetails.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
        }
        if (!salary)
            return res.status(404).send('Salary not found for the selected month');
        // Generate password: employeeNumber + DOB (DDMMYYYY)
        const dob = employee.dateOfBirth;
        const dobStr = `${('0' + dob.getDate()).slice(-2)}${('0' + (dob.getMonth() + 1)).slice(-2)}${dob.getFullYear()}`;
        const password = `${employee.employeeNumber}_${dobStr}`;
        console.log("Password is:", password);
        // Create PDF
        const doc = new pdfkit_1.default({ userPassword: password, ownerPassword: password });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res
                .writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=Payslip_${employee.employeeNumber}.pdf`,
                'Content-Length': pdfData.length,
            })
                .end(pdfData);
        });
        // ---------------- PDF Content ----------------
        doc.fontSize(18).text('Payslip', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Employee: ${employee.user.fullName}`);
        doc.text(`Employee No: ${employee.employeeNumber}`);
        doc.text(`Designation: ${employee.position}`);
        doc.text(`Department: ${employee.department?.name || 'N/A'}`);
        doc.text(`Sub Department: ${employee.subDepartment?.name || 'N/A'}`);
        doc.text(`Hire Date: ${employee.hireDate.toLocaleDateString()}`);
        doc.text(`Work Location: ${employee.workLocation}`);
        doc.moveDown();
        // Earnings
        doc.text('--- Earnings ---');
        doc.text(`Basic Salary: Rs.${salary.baseSalary.toFixed(2)}`);
        salary.allowances.forEach((a) => doc.text(`${a.type}: Rs.${a.amount.toFixed(2)}`));
        doc.text(`Bonuses: Rs.${salary.bonuses.toFixed(2)}`);
        const totalEarnings = Number(salary.baseSalary) +
            salary.allowances.reduce((sum, a) => sum + Number(a.amount), 0) +
            Number(salary.bonuses);
        doc.text(`Total Earnings: Rs.${totalEarnings.toFixed(2)}`);
        doc.moveDown();
        // Deductions
        doc.text('--- Deductions ---');
        doc.text(`Deductions: Rs.${salary.deductions.toFixed(2)}`);
        const netPay = salary.totalPay;
        doc.text(`Net Salary: Rs.${netPay.toFixed(2)}`);
        doc.end();
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server error while generating PDF');
    }
};
exports.getSalarySlip = getSalarySlip;
