/*
  Warnings:

  - Made the column `level` on table `subrole` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `subrole` MODIFY `level` INTEGER NOT NULL;
