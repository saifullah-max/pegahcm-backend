/*
  Warnings:

  - You are about to drop the column `due_date` on the `milestones` table. All the data in the column will be lost.
  - Added the required column `actual_hours` to the `milestones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deadline` to the `milestones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimated_hours` to the `milestones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revenue` to the `milestones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employees` ADD COLUMN `milestonesId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `milestones` DROP COLUMN `due_date`,
    ADD COLUMN `actual_hours` INTEGER NOT NULL,
    ADD COLUMN `deadline` DATETIME(3) NOT NULL,
    ADD COLUMN `documents` JSON NULL,
    ADD COLUMN `estimated_hours` INTEGER NOT NULL,
    ADD COLUMN `revenue` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_milestonesId_fkey` FOREIGN KEY (`milestonesId`) REFERENCES `milestones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
