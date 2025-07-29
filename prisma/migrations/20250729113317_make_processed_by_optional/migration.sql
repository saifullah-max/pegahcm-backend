-- DropForeignKey
ALTER TABLE `resignation` DROP FOREIGN KEY `Resignation_processedById_fkey`;

-- DropIndex
DROP INDEX `Resignation_processedById_fkey` ON `resignation`;

-- AlterTable
ALTER TABLE `resignation` MODIFY `processedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Resignation` ADD CONSTRAINT `Resignation_processedById_fkey` FOREIGN KEY (`processedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
