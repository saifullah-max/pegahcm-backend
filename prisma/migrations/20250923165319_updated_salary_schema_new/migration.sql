/*
  Warnings:

  - Made the column `effective_from` on table `salary_details` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `salary_details` MODIFY `effective_from` DATETIME(3) NOT NULL;
