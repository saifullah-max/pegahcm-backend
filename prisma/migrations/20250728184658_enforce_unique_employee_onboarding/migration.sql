/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `OnboardingProcess` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `OnboardingProcess_employeeId_key` ON `OnboardingProcess`(`employeeId`);
