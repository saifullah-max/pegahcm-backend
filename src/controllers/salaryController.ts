import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../utils/Prisma';

// Helper to calculate total salary
export const calculateTotalSalary = (
    baseSalary: number,
    allowances: number,
    deductions: number,
    bonuses: number
) => {
    return baseSalary + allowances + bonuses - deductions;
};

// Create salary
export const createSalary = async (req: Request, res: Response) => {
    try {
        const { employeeId, baseSalary, deductions, bonuses, allowances, effectiveFrom, effectiveTo } = req.body;
        console.log("Employee ID:", employeeId);
        if (!employeeId) {
            return res.status(400).json({ error: "employeeId is required" });
        }

        const createdSalary = await prisma.salaryDetail.create({
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
            await prisma.allowance.createMany({
                data: allowances.map((a: any) => ({
                    salaryId: createdSalary.id,
                    type: a.type,
                    amount: Number(a.amount) || 0
                }))
            });
        }

        // Calculate total
        const totalAllowances = allowances?.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || 0;
        const totalPay = Number(baseSalary) + totalAllowances + Number(bonuses) - Number(deductions);

        await prisma.salaryDetail.update({
            where: { id: createdSalary.id },
            data: { totalPay }
        });

        res.status(201).json({ success: true, data: { ...createdSalary, totalPay } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating salary', error });
    }
};

// Update salary
export const updateSalary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { baseSalary, deductions, bonuses, allowances, effectiveFrom, effectiveTo } = req.body;

        // 1️⃣ Fetch existing salary
        const existingSalary = await prisma.salaryDetail.findUnique({
            where: { id },
            include: { allowances: true }
        });

        if (!existingSalary) {
            return res.status(404).json({ success: false, message: 'Salary record not found' });
        }

        // 2️⃣ Update basic salary fields
        const updatedSalary = await prisma.salaryDetail.update({
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
            await prisma.allowance.deleteMany({ where: { salaryId: id } });

            // Insert new ones
            if (allowances.length > 0) {
                await prisma.allowance.createMany({
                    data: allowances.map((a: any) => ({
                        salaryId: id,
                        type: a.type,
                        amount: Number(a.amount) || 0
                    }))
                });
            }
        }

        // 4️⃣ Recalculate totalPay
        const updatedAllowances = await prisma.allowance.findMany({ where: { salaryId: id } });
        const totalAllowances = updatedAllowances.reduce((sum: any, a: any) => sum + Number(a.amount), 0);

        const totalPay = Number(updatedSalary.baseSalary) + totalAllowances + Number(updatedSalary.bonuses) - Number(updatedSalary.deductions);

        await prisma.salaryDetail.update({
            where: { id },
            data: { totalPay }
        });

        // 5️⃣ Return updated record with allowances
        const finalRecord = await prisma.salaryDetail.findUnique({
            where: { id },
            include: { allowances: true }
        });

        res.json({ success: true, data: finalRecord });

    } catch (error) {
        console.error("Error updating salary:", error);
        res.status(500).json({ success: false, message: 'Error updating salary', error });
    }
};

// Delete salary
export const deleteSalary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.salaryDetail.delete({ where: { id } });
        res.json({ success: true, message: 'Salary deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting salary', error });
    }
};

// Get all salaries
export const getAllSalaries = async (req: Request, res: Response) => {
    try {
        const salaries = await prisma.salaryDetail.findMany({
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
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salaries', error });
    }
};

// Get single salary
export const getSalaryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const salary = await prisma.salaryDetail.findUnique({
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
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary', error });
    }
};

// Get own salary
export const getMySalary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const employee = await prisma.employee.findUnique({
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
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary', error });
    }
};

// incase of no change for next month salary
export const copyPreviousSalaryByEmployee = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });

        // Optionally verify user permission here if needed

        // Find latest salary for the given employeeId
        const latestSalary = await prisma.salaryDetail.findFirst({
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
        const newSalary = await prisma.salaryDetail.create({
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
                    create: latestSalary.allowances.map((a: any) => ({
                        type: a.type,
                        amount: a.amount,
                    })),
                },
            },
            include: { allowances: true },
        });

        res.status(201).json({ success: true, data: newSalary });
    } catch (error) {
        console.error('Error copying salary:', error);
        res.status(500).json({ success: false, message: 'Error copying salary', error });
    }
};

/**
 * GET /api/payslip/download/:employeeId?month=YYYY-MM
 * Returns a password-protected PDF of the employee's payslip
 */
export const getSalarySlip = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const { month } = req.query as { month?: string }; // optional month filter

        // Fetch employee details including user info
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
            ,
            include: { user: true, department: true, subDepartment: true, salaryDetails: { include: { allowances: true } } }
        });

        if (!employee) return res.status(404).send('Employee not found');
        console.log("Available salary months:", employee.salaryDetails.map((s: any) => s.effectiveFrom));

        // Determine salary for requested month or latest
        let salary: typeof employee.salaryDetails[0] | undefined;
        if (month) {
            const [year, mon] = month.split('-').map(Number);
            salary = employee.salaryDetails.find((s: any) =>
                s.effectiveFrom.getFullYear() === year && s.effectiveFrom.getMonth() + 1 === mon
            );
        }
        if (!salary) {
            salary = employee.salaryDetails.sort((a: any, b: any) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
        }
        if (!salary) return res.status(404).send('Salary not found for the selected month');

        // Generate password: employeeNumber + DOB (DDMMYYYY)
        const dob = employee.dateOfBirth;
        const dobStr = `${('0' + dob.getDate()).slice(-2)}${('0' + (dob.getMonth() + 1)).slice(-2)}${dob.getFullYear()}`;
        const password = `${employee.employeeNumber}_${dobStr}`;
        console.log("Password is:", password);

        // Create PDF
        const doc = new PDFDocument({ userPassword: password, ownerPassword: password });
        const buffers: any[] = [];
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
        salary.allowances.forEach((a: any) => doc.text(`${a.type}: Rs.${a.amount.toFixed(2)}`));
        doc.text(`Bonuses: Rs.${salary.bonuses.toFixed(2)}`);
        const totalEarnings =
            Number(salary.baseSalary) +
            salary.allowances.reduce((sum: any, a: any) => sum + Number(a.amount), 0) +
            Number(salary.bonuses); doc.text(`Total Earnings: Rs.${totalEarnings.toFixed(2)}`);
        doc.moveDown();

        // Deductions
        doc.text('--- Deductions ---');
        doc.text(`Deductions: Rs.${salary.deductions.toFixed(2)}`);
        const netPay = salary.totalPay;
        doc.text(`Net Salary: Rs.${netPay.toFixed(2)}`);

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while generating PDF');
    }
};