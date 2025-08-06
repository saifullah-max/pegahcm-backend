-- DropForeignKey
ALTER TABLE `attendancefixrequest` DROP FOREIGN KEY `AttendanceFixRequest_attendanceRecordId_fkey`;

-- DropIndex
DROP INDEX `AttendanceFixRequest_attendanceRecordId_fkey` ON `attendancefixrequest`;

-- AlterTable
ALTER TABLE `attendancefixrequest` MODIFY `attendanceRecordId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `AttendanceFixRequest` ADD CONSTRAINT `AttendanceFixRequest_attendanceRecordId_fkey` FOREIGN KEY (`attendanceRecordId`) REFERENCES `AttendanceRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
