/*
  Warnings:

  - You are about to drop the column `project_type` on the `bids` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `bids` DROP COLUMN `project_type`,
    ADD COLUMN `project_type_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `bids` ADD CONSTRAINT `bids_project_type_id_fkey` FOREIGN KEY (`project_type_id`) REFERENCES `project_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
