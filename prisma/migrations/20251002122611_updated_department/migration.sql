/*
  Warnings:

  - A unique constraint covering the columns `[name,head_id]` on the table `departments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `departments_name_head_id_key` ON `departments`(`name`, `head_id`);
