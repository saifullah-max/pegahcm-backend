-- DropForeignKey
ALTER TABLE `employeedocument` DROP FOREIGN KEY `EmployeeDocument_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `employeeimage` DROP FOREIGN KEY `EmployeeImage_employeeId_fkey`;

-- AddForeignKey
ALTER TABLE `employeeImage` ADD CONSTRAINT `employeeImage_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employeeDocument` ADD CONSTRAINT `employeeDocument_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
