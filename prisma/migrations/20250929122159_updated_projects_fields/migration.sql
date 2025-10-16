/*
  Warnings:

  - Added the required column `client_name` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upwork_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `projects` ADD COLUMN `assignee_id` VARCHAR(191) NULL,
    ADD COLUMN `client_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `deadline` DATETIME(3) NULL,
    ADD COLUMN `documents` JSON NULL,
    ADD COLUMN `number_of_hours` INTEGER NULL,
    ADD COLUMN `sales_person_id` VARCHAR(191) NULL,
    ADD COLUMN `upwork_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_sales_person_id_fkey` FOREIGN KEY (`sales_person_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_assignee_id_fkey` FOREIGN KEY (`assignee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
