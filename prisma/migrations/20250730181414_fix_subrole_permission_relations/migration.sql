/*
  Warnings:

  - You are about to drop the column `subRole` on the `subrolepermission` table. All the data in the column will be lost.
  - You are about to drop the column `subRole` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subRoleId,permissionId]` on the table `SubRolePermission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subRoleId` to the `SubRolePermission` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `SubRolePermission_subRole_permissionId_key` ON `subrolepermission`;

-- AlterTable
ALTER TABLE `subrolepermission` DROP COLUMN `subRole`,
    ADD COLUMN `subRoleId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `subRole`,
    ADD COLUMN `subRoleId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SubRole` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `SubRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `SubRolePermission_subRoleId_permissionId_key` ON `SubRolePermission`(`subRoleId`, `permissionId`);

-- AddForeignKey
ALTER TABLE `SubRolePermission` ADD CONSTRAINT `SubRolePermission_subRoleId_fkey` FOREIGN KEY (`subRoleId`) REFERENCES `SubRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_subRoleId_fkey` FOREIGN KEY (`subRoleId`) REFERENCES `SubRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
