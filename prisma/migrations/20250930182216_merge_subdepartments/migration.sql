/*
  Warnings:

  - You are about to drop the `sub_departments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `employees` DROP FOREIGN KEY `employees_sub_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `sub_departments` DROP FOREIGN KEY `sub_departments_department_id_fkey`;

-- DropIndex
DROP INDEX `employees_sub_department_id_fkey` ON `employees`;

-- AlterTable
ALTER TABLE `departments` ADD COLUMN `parent_id` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `sub_departments`;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
