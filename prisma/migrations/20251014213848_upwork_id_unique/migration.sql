/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `upwork_ids` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `upwork_ids_link_key` ON `upwork_ids`(`link`);
