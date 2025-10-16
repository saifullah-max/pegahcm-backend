/*
  Warnings:

  - You are about to drop the column `attend_by` on the `bids` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `bids` DROP COLUMN `attend_by`,
    ADD COLUMN `attend_by_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `bids` ADD CONSTRAINT `bids_attend_by_id_fkey` FOREIGN KEY (`attend_by_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
