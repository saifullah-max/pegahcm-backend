-- DropForeignKey
ALTER TABLE `leaverequest` DROP FOREIGN KEY `LeaveRequest_approvedById_fkey`;

-- DropIndex
DROP INDEX `LeaveRequest_approvedById_fkey` ON `leaverequest`;

-- AlterTable
ALTER TABLE `leaverequest` MODIFY `approvedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
