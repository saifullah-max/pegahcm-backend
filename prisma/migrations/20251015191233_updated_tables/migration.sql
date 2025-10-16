/*
  Warnings:

  - You are about to drop the column `milestonesId` on the `employees` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `employees` DROP FOREIGN KEY `employees_milestonesId_fkey`;

-- DropIndex
DROP INDEX `employees_milestonesId_fkey` ON `employees`;

-- AlterTable
ALTER TABLE `employees` DROP COLUMN `milestonesId`,
    ADD COLUMN `milestones_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_milestones_id_fkey` FOREIGN KEY (`milestones_id`) REFERENCES `milestones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
