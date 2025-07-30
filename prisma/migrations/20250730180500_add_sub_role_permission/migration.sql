-- CreateTable
CREATE TABLE `SubRolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `subRole` ENUM('director', 'manager', 'teamLead', 'teamMember') NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SubRolePermission_subRole_permissionId_key`(`subRole`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SubRolePermission` ADD CONSTRAINT `SubRolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
