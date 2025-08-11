/*
  Warnings:

  - You are about to drop the column `allowanceType` on the `salarydetail` table. All the data in the column will be lost.
  - You are about to drop the column `allowances` on the `salarydetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `salarydetail` DROP COLUMN `allowanceType`,
    DROP COLUMN `allowances`;

-- CreateTable
CREATE TABLE `Allowance` (
    `id` VARCHAR(191) NOT NULL,
    `salaryId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Allowance` ADD CONSTRAINT `Allowance_salaryId_fkey` FOREIGN KEY (`salaryId`) REFERENCES `SalaryDetail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
