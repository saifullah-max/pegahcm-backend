/*
  Warnings:

  - A unique constraint covering the columns `[module,action]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleId,permissionId]` on the table `RolePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,permissionId]` on the table `UserPermission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `subRole` ENUM('director', 'manager', 'teamLead', 'teamMember') NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Permission_module_action_key` ON `Permission`(`module`, `action`);

-- CreateIndex
CREATE UNIQUE INDEX `RolePermission_roleId_permissionId_key` ON `RolePermission`(`roleId`, `permissionId`);

-- CreateIndex
CREATE UNIQUE INDEX `UserPermission_userId_permissionId_key` ON `UserPermission`(`userId`, `permissionId`);
