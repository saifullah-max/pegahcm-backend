/*
  Warnings:

  - Added the required column `address` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactName` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactPhone` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workLocation` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employee` ADD COLUMN `address` VARCHAR(191) NOT NULL,
    ADD COLUMN `emergencyContactName` VARCHAR(191) NOT NULL,
    ADD COLUMN `emergencyContactPhone` VARCHAR(191) NOT NULL,
    ADD COLUMN `gender` VARCHAR(191) NOT NULL,
    ADD COLUMN `salary` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `workLocation` VARCHAR(191) NOT NULL;
