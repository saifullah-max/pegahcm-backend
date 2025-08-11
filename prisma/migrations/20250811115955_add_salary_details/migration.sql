-- CreateTable
CREATE TABLE `SalaryDetail` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `baseSalary` DECIMAL(10, 2) NOT NULL,
    `allowances` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `deductions` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `bonuses` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalPay` DECIMAL(10, 2) NOT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveTo` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SalaryDetail` ADD CONSTRAINT `SalaryDetail_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
