/*
  Warnings:

  - Added the required column `totalDays` to the `LeaveType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `leavetype` ADD COLUMN `totalDays` INTEGER NOT NULL;
