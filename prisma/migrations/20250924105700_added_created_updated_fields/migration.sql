/*
  Warnings:

  - You are about to drop the column `uploaded_at` on the `bulk_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_at` on the `employee_images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `allowances` ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL,
    MODIFY `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `assets` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `attendance_fix_requests` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `attendance_records` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `break_types` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `breaks` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bulk_uploads` DROP COLUMN `uploaded_at`,
    ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `departments` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `document_categories` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `employee_documents` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `employee_images` DROP COLUMN `uploaded_at`,
    ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `employees` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `holidays` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `hr_processes` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `leave_balances` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL,
    MODIFY `updated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `leave_requests` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `leave_types` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL,
    MODIFY `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `onboarding_processes` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `resignation_assets` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `resignations` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `role_permissions` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `salary_details` MODIFY `created_by` VARCHAR(191) NULL,
    MODIFY `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `shifts` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sub_departments` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sub_role_permissions` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sub_roles` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `system_logs` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `system_settings` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL,
    MODIFY `updated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user_notifications` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user_permissions` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `vacations` ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `created_by` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by` VARCHAR(191) NULL;
