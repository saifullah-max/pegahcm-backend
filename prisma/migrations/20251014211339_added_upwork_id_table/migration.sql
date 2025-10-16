-- AlterTable
ALTER TABLE `bids` ADD COLUMN `upwork_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `projects` MODIFY `upwork_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `upwork_ids` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `upwork_ids_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bids` ADD CONSTRAINT `bids_upwork_id_fkey` FOREIGN KEY (`upwork_id`) REFERENCES `upwork_ids`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_upwork_id_fkey` FOREIGN KEY (`upwork_id`) REFERENCES `upwork_ids`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
