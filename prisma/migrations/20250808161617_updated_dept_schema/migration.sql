-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_departmentId_fkey`;

-- DropIndex
DROP INDEX `Employee_departmentId_fkey` ON `employee`;

-- AlterTable
ALTER TABLE `employee` MODIFY `departmentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
