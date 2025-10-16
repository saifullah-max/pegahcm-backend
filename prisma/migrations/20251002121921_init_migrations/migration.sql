/*
  Warnings:

  - You are about to drop the column `created_at` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `departments` table. All the data in the column will be lost.
  - Added the required column `head_id` to the `departments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `departments` DROP FOREIGN KEY `departments_parent_id_fkey`;

-- DropIndex
DROP INDEX `departments_name_key` ON `departments`;

-- DropIndex
DROP INDEX `departments_parent_id_fkey` ON `departments`;

-- AlterTable
ALTER TABLE `departments` DROP COLUMN `created_at`,
    DROP COLUMN `created_by`,
    DROP COLUMN `parent_id`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `updated_by`,
    ADD COLUMN `head_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `head_departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `code` VARCHAR(191) NULL,
    `manager_id` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `head_departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_head_id_fkey` FOREIGN KEY (`head_id`) REFERENCES `head_departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
