-- DropForeignKey
ALTER TABLE `asset` DROP FOREIGN KEY `Asset_assignedToId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `employeedocument` DROP FOREIGN KEY `employeeDocument_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `employeeimage` DROP FOREIGN KEY `employeeImage_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `hrprocess` DROP FOREIGN KEY `HRProcess_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `leavebalance` DROP FOREIGN KEY `LeaveBalance_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `leaverequest` DROP FOREIGN KEY `LeaveRequest_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `onboardingprocess` DROP FOREIGN KEY `OnboardingProcess_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `resignation` DROP FOREIGN KEY `Resignation_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `vacation` DROP FOREIGN KEY `Vacation_employeeId_fkey`;

-- DropIndex
DROP INDEX `Asset_assignedToId_fkey` ON `asset`;

-- DropIndex
DROP INDEX `AttendanceRecord_employeeId_fkey` ON `attendancerecord`;

-- DropIndex
DROP INDEX `employeeDocument_employeeId_fkey` ON `employeedocument`;

-- DropIndex
DROP INDEX `employeeImage_employeeId_fkey` ON `employeeimage`;

-- DropIndex
DROP INDEX `HRProcess_employeeId_fkey` ON `hrprocess`;

-- DropIndex
DROP INDEX `LeaveBalance_employeeId_fkey` ON `leavebalance`;

-- DropIndex
DROP INDEX `LeaveRequest_employeeId_fkey` ON `leaverequest`;

-- DropIndex
DROP INDEX `Resignation_employeeId_fkey` ON `resignation`;

-- DropIndex
DROP INDEX `Vacation_employeeId_fkey` ON `vacation`;

-- AddForeignKey
ALTER TABLE `employeeDocument` ADD CONSTRAINT `employeeDocument_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalance` ADD CONSTRAINT `LeaveBalance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employeeImage` ADD CONSTRAINT `employeeImage_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacation` ADD CONSTRAINT `Vacation_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OnboardingProcess` ADD CONSTRAINT `OnboardingProcess_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resignation` ADD CONSTRAINT `Resignation_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRProcess` ADD CONSTRAINT `HRProcess_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
