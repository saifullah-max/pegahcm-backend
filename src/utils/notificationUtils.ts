import { Prisma, PrismaClient } from "@prisma/client";

// utils/notificationUtils.ts
const prisma = new PrismaClient();

type VisibilityScope = 'ADMIN_ONLY' | 'DIRECTORS_HR' | 'MANAGERS_DEPT' | 'TEAMLEADS_SUBDEPT' | 'EMPLOYEE_ONLY' | 'ASSIGNED_USER';

interface NotifyOptions {
    scope: VisibilityScope;
    data: { title: string; message: string; type: string };
    targetIds?: {
        userId?: string;
        employeeId?: string;
        departmentId?: string;
        subDepartmentId?: string;
    };
    visibilityLevel?: number; // Optional override
}

export async function createScopedNotification(opts: NotifyOptions) {
    const { scope, data, targetIds, visibilityLevel } = opts;

    switch (scope) {
        case 'ADMIN_ONLY':
            return prisma.notification.create({
                data: {
                    ...data,
                    visibilityLevel: 0
                }
            });

        case 'DIRECTORS_HR':
            return prisma.notification.create({
                data: {
                    ...data,
                    visibilityLevel: 2 // directors or HRs with level <= 2
                }
            });

        case 'MANAGERS_DEPT':
            return prisma.notification.create({
                data: {
                    ...data,
                    departmentId: targetIds?.departmentId
                }
            });

        case 'TEAMLEADS_SUBDEPT':
            return prisma.notification.create({
                data: {
                    ...data,
                    subDepartmentId: targetIds?.subDepartmentId
                }
            });

        case 'EMPLOYEE_ONLY':
            return prisma.notification.create({
                data: {
                    ...data,
                    employeeId: targetIds?.employeeId
                }
            });

        case 'ASSIGNED_USER':
            return prisma.notification.create({
                data: {
                    ...data,
                    userId: targetIds?.userId
                }
            });

        default:
            throw new Error('Unknown notification scope');
    }
}

