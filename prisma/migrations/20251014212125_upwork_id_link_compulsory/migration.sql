/*
  Warnings:

  - Made the column `link` on table `upwork_ids` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `upwork_ids` MODIFY `link` VARCHAR(191) NOT NULL;
