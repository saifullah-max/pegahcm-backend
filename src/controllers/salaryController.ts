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
        const { employee_id, base_salary, deductions, bonuses, allowances, effective_from, effective_to } = req.body;
        console.log("Employee ID:", employee_id);
        if (!employee_id) {
            return res.status(400).json({ error: "employee_id is required" });
        }

        const createdSalary = await prisma.salary_details.create({
            data: {
                base_salary,
                deductions,
                bonuses,
                total_pay: 0,
                effective_from,
                effective_to,
                created_by: req.user?.userId || "system",
                employee: {
                    connect: { id: employee_id },
                },
                allowances: allowances && allowances.length > 0
                    ? {
                        create: allowances.map((a: any) => ({
                            type: a.type,
                            amount: Number(a.amount) || 0,
                        })),
                    }
                    : undefined,
                created_at: new Date(),
            },
        });

        // if (allowances && allowances.length > 0) {
        //     await prisma.allowances.createMany({
        //         data: allowances.map((a: any) => ({
        //             salary_id: createdSalary.id,
        //             type: a.type,
        //             amount: Number(a.amount) || 0
        //         }))
        //     });
        // }

        // Calculate total
        const totalAllowances = allowances?.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || 0;
        const total_pay = Number(base_salary) + totalAllowances + Number(bonuses) - Number(deductions);

        await prisma.salary_details.update({
            where: { id: createdSalary.id },
            data: { total_pay }
        });

        res.status(201).json({ success: true, data: { ...createdSalary, total_pay } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating salary', error });
    }
};

// Update salary
export const updateSalary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { base_salary, deductions, bonuses, allowances, effective_from, effective_to } = req.body;

        // 1️⃣ Fetch existing salary
        const existingSalary = await prisma.salary_details.findUnique({
            where: { id },
            include: { allowances: true }
        });

        if (!existingSalary) {
            return res.status(404).json({ success: false, message: 'Salary record not found' });
        }

        // 2️⃣ Update basic salary fields
        const updatedSalary = await prisma.salary_details.update({
            where: { id },
            data: {
                base_salary: base_salary !== undefined ? Number(base_salary) : existingSalary.base_salary,
                deductions: deductions !== undefined ? Number(deductions) : existingSalary.deductions,
                bonuses: bonuses !== undefined ? Number(bonuses) : existingSalary.bonuses,
                effective_from: effective_from ? new Date(effective_from) : existingSalary.effective_from,
                effective_to: effective_to ? new Date(effective_to) : existingSalary.effective_to,
                updated_by: req.user?.userId || existingSalary.updated_by
            }
        });


        // 3️⃣ If allowances are provided, replace them
        if (Array.isArray(allowances)) {
            // Delete old allowances
            await prisma.allowances.deleteMany({ where: { salary_id: id } });

            // Insert new ones
            if (allowances.length > 0) {
                await prisma.allowances.createMany({
                    data: allowances.map((a: any) => ({
                        salary_id: id,
                        type: a.type,
                        amount: Number(a.amount) || 0
                    }))
                });
            }
        }

        // 4️⃣ Recalculate total_pay
        const updatedAllowances = await prisma.allowances.findMany({ where: { salary_id: id } });
        const totalAllowances = updatedAllowances.reduce((sum: any, a: any) => sum + Number(a.amount), 0);

        const total_pay = Number(updatedSalary.base_salary) + totalAllowances + Number(updatedSalary.bonuses) - Number(updatedSalary.deductions);

        await prisma.salary_details.update({
            where: { id },
            data: { total_pay }
        });

        // 5️⃣ Return updated record with allowances
        const finalRecord = await prisma.salary_details.findUnique({
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
        await prisma.salary_details.delete({ where: { id } });
        res.json({ success: true, message: 'Salary deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting salary', error });
    }
};

// Get all salaries
export const getAllSalaries = async (req: Request, res: Response) => {
    try {
        const salaries = await prisma.salary_details.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        position: true,
                        user: { select: { full_name: true, email: true } },
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
        const salary = await prisma.salary_details.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        position: true,
                        user: { select: { full_name: true, email: true } },
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
        const user_id = req.user?.userId;
        if (!user_id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const employee = await prisma.employees.findUnique({
            where: { user_id },
            include: {
                salary_details: {
                    include: {
                        allowances: true
                    }
                }
            }

        });

        res.json({ success: true, data: employee?.salary_details || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching salary', error });
    }
};

// incase of no change for next month salary
export const copyPreviousSalaryByEmployee = async (req: Request, res: Response) => {
    try {
        const { employee_id } = req.params;
        if (!employee_id) return res.status(400).json({ success: false, message: 'employee_id is required' });

        // Optionally verify user permission here if needed

        // Find latest salary for the given employee_id
        const latestSalary = await prisma.salary_details.findFirst({
            where: { employee_id },
            orderBy: { effective_from: 'desc' },
            include: { allowances: true },
        });

        if (!latestSalary) {
            return res.status(404).json({ success: false, message: 'No previous salary found to copy' });
        }

        // Calculate next month dates
        const nextEffectiveFrom = new Date(latestSalary.effective_from);
        nextEffectiveFrom.setMonth(nextEffectiveFrom.getMonth() + 1);

        let nextEffectiveTo = null;
        if (latestSalary.effective_to) {
            nextEffectiveTo = new Date(latestSalary.effective_to);
            nextEffectiveTo.setMonth(nextEffectiveTo.getMonth() + 1);
        }

        // Create new salary with same amounts and allowances but updated dates
        const newSalary = await prisma.salary_details.create({
            data: {
                employee_id,
                base_salary: latestSalary.base_salary,
                deductions: latestSalary.deductions,
                bonuses: latestSalary.bonuses,
                effective_from: nextEffectiveFrom,
                effective_to: nextEffectiveTo,
                created_by: req.user?.userId || 'system',
                total_pay: latestSalary.total_pay,
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
        const { employee_id } = req.params;
        const { month } = req.query as { month?: string }; // optional month filter

        // Fetch employee details including user info
        const employee = await prisma.employees.findUnique({
            where: { id: employee_id }
            ,
            include: { user: true, department: true, sub_department: true, salary_details: { include: { allowances: true } } }
        });

        if (!employee) return res.status(404).send('Employee not found');
        console.log("Available salary months:", employee.salary_details.map((s: any) => s.effective_from));

        // Determine salary for requested month or latest
        let salary: typeof employee.salary_details[0] | undefined;
        if (month) {
            const [year, mon] = month.split('-').map(Number);
            salary = employee.salary_details.find((s: any) =>
                s.effective_from.getFullYear() === year && s.effective_from.getMonth() + 1 === mon
            );
        }
        if (!salary) {
            salary = employee.salary_details.sort((a: any, b: any) => b.effective_from.getTime() - a.effective_from.getTime())[0];
        }
        if (!salary) return res.status(404).send('Salary not found for the selected month');

        // Generate password: employee_number + DOB (DDMMYYYY)
        const dob = employee.date_of_birth;
        const dobStr = `${('0' + dob.getDate()).slice(-2)}${('0' + (dob.getMonth() + 1)).slice(-2)}${dob.getFullYear()}`;
        const password = `${employee.employee_number}_${dobStr}`;
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
                    'Content-Disposition': `attachment; filename=Payslip_${employee.employee_number}.pdf`,
                    'Content-Length': pdfData.length,
                })
                .end(pdfData);
        });

        // ---------------- PDF Content ----------------
        doc.fontSize(18).text('Payslip', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Employee: ${employee.user.full_name}`);
        doc.text(`Employee No: ${employee.employee_number}`);
        doc.text(`Designation: ${employee.position}`);
        doc.text(`Department: ${employee.department?.name || 'N/A'}`);
        doc.text(`Sub Department: ${employee.sub_department?.name || 'N/A'}`);
        doc.text(`Hire Date: ${employee.hire_date.toLocaleDateString()}`);
        doc.text(`Work Location: ${employee.work_location}`);
        doc.moveDown();

        // Earnings
        doc.text('--- Earnings ---');
        doc.text(`Basic Salary: Rs.${salary.base_salary.toFixed(2)}`);
        salary.allowances.forEach((a: any) => doc.text(`${a.type}: Rs.${a.amount.toFixed(2)}`));
        doc.text(`Bonuses: Rs.${salary.bonuses.toFixed(2)}`);
        const totalEarnings =
            Number(salary.base_salary) +
            salary.allowances.reduce((sum: any, a: any) => sum + Number(a.amount), 0) +
            Number(salary.bonuses); doc.text(`Total Earnings: Rs.${totalEarnings.toFixed(2)}`);
        doc.moveDown();

        // Deductions
        doc.text('--- Deductions ---');
        doc.text(`Deductions: Rs.${salary.deductions.toFixed(2)}`);
        const netPay = salary.total_pay;
        doc.text(`Net Salary: Rs.${netPay.toFixed(2)}`);

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while generating PDF');
    }
};