/*
  Warnings:

  - You are about to drop the `allowance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendancefixrequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendancerecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `break` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `breaktype` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bulkupload` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documentcategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employeedocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employeeimage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `holiday` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hrprocess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leavebalance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leaverequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leavetype` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `onboardingprocess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resignation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resignationasset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rolepermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salarydetail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subdepartment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subrole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subrolepermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `systemlog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `systemsetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usernotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userpermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vacation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `allowance` DROP FOREIGN KEY `Allowance_salaryId_fkey`;

-- DropForeignKey
ALTER TABLE `asset` DROP FOREIGN KEY `Asset_assignedToId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancefixrequest` DROP FOREIGN KEY `AttendanceFixRequest_attendanceRecordId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancefixrequest` DROP FOREIGN KEY `AttendanceFixRequest_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancefixrequest` DROP FOREIGN KEY `AttendanceFixRequest_reviewedById_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `attendancerecord` DROP FOREIGN KEY `AttendanceRecord_shiftId_fkey`;

-- DropForeignKey
ALTER TABLE `break` DROP FOREIGN KEY `Break_attendanceRecordId_fkey`;

-- DropForeignKey
ALTER TABLE `break` DROP FOREIGN KEY `Break_breakTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `bulkupload` DROP FOREIGN KEY `BulkUpload_uploadedById_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_managerId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_shiftId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_subDepartmentId_fkey`;

-- DropForeignKey
ALTER TABLE `employee` DROP FOREIGN KEY `Employee_userId_fkey`;

-- DropForeignKey
ALTER TABLE `employeedocument` DROP FOREIGN KEY `employeeDocument_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `employeedocument` DROP FOREIGN KEY `employeeDocument_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `employeeimage` DROP FOREIGN KEY `employeeImage_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `hrprocess` DROP FOREIGN KEY `HRProcess_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `hrprocess` DROP FOREIGN KEY `HRProcess_initiatedById_fkey`;

-- DropForeignKey
ALTER TABLE `leavebalance` DROP FOREIGN KEY `LeaveBalance_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `leavebalance` DROP FOREIGN KEY `LeaveBalance_leaveTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `leaverequest` DROP FOREIGN KEY `LeaveRequest_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `leaverequest` DROP FOREIGN KEY `LeaveRequest_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `leaverequest` DROP FOREIGN KEY `LeaveRequest_leaveTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `onboardingprocess` DROP FOREIGN KEY `OnboardingProcess_assignedHRId_fkey`;

-- DropForeignKey
ALTER TABLE `onboardingprocess` DROP FOREIGN KEY `OnboardingProcess_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `resignation` DROP FOREIGN KEY `Resignation_clearanceResponsibleId_fkey`;

-- DropForeignKey
ALTER TABLE `resignation` DROP FOREIGN KEY `Resignation_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `resignation` DROP FOREIGN KEY `Resignation_processedById_fkey`;

-- DropForeignKey
ALTER TABLE `resignationasset` DROP FOREIGN KEY `ResignationAsset_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `resignationasset` DROP FOREIGN KEY `ResignationAsset_resignationId_fkey`;

-- DropForeignKey
ALTER TABLE `rolepermission` DROP FOREIGN KEY `RolePermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `rolepermission` DROP FOREIGN KEY `RolePermission_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `salarydetail` DROP FOREIGN KEY `SalaryDetail_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `subdepartment` DROP FOREIGN KEY `SubDepartment_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `subrolepermission` DROP FOREIGN KEY `SubRolePermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `subrolepermission` DROP FOREIGN KEY `SubRolePermission_subRoleId_fkey`;

-- DropForeignKey
ALTER TABLE `systemlog` DROP FOREIGN KEY `SystemLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_subRoleId_fkey`;

-- DropForeignKey
ALTER TABLE `usernotification` DROP FOREIGN KEY `UserNotification_notificationId_fkey`;

-- DropForeignKey
ALTER TABLE `usernotification` DROP FOREIGN KEY `UserNotification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `userpermission` DROP FOREIGN KEY `UserPermission_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `userpermission` DROP FOREIGN KEY `UserPermission_userId_fkey`;

-- DropForeignKey
ALTER TABLE `vacation` DROP FOREIGN KEY `Vacation_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `vacation` DROP FOREIGN KEY `Vacation_employeeId_fkey`;

-- DropTable
DROP TABLE `allowance`;

-- DropTable
DROP TABLE `asset`;

-- DropTable
DROP TABLE `attendancefixrequest`;

-- DropTable
DROP TABLE `attendancerecord`;

-- DropTable
DROP TABLE `break`;

-- DropTable
DROP TABLE `breaktype`;

-- DropTable
DROP TABLE `bulkupload`;

-- DropTable
DROP TABLE `department`;

-- DropTable
DROP TABLE `documentcategory`;

-- DropTable
DROP TABLE `employee`;

-- DropTable
DROP TABLE `employeedocument`;

-- DropTable
DROP TABLE `employeeimage`;

-- DropTable
DROP TABLE `holiday`;

-- DropTable
DROP TABLE `hrprocess`;

-- DropTable
DROP TABLE `leavebalance`;

-- DropTable
DROP TABLE `leaverequest`;

-- DropTable
DROP TABLE `leavetype`;

-- DropTable
DROP TABLE `notification`;

-- DropTable
DROP TABLE `onboardingprocess`;

-- DropTable
DROP TABLE `permission`;

-- DropTable
DROP TABLE `resignation`;

-- DropTable
DROP TABLE `resignationasset`;

-- DropTable
DROP TABLE `role`;

-- DropTable
DROP TABLE `rolepermission`;

-- DropTable
DROP TABLE `salarydetail`;

-- DropTable
DROP TABLE `shift`;

-- DropTable
DROP TABLE `subdepartment`;

-- DropTable
DROP TABLE `subrole`;

-- DropTable
DROP TABLE `subrolepermission`;

-- DropTable
DROP TABLE `systemlog`;

-- DropTable
DROP TABLE `systemsetting`;

-- DropTable
DROP TABLE `user`;

-- DropTable
DROP TABLE `usernotification`;

-- DropTable
DROP TABLE `userpermission`;

-- DropTable
DROP TABLE `vacation`;

-- CreateTable
CREATE TABLE `sub_roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `level` INTEGER NOT NULL,

    UNIQUE INDEX `sub_roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `permissions_module_action_key`(`module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `permission_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `sub_role_id` VARCHAR(191) NOT NULL,
    `permission_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sub_role_permissions_sub_role_id_permission_id_key`(`sub_role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `permission_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `user_permissions_user_id_permission_id_key`(`user_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `date_joined` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login` DATETIME(3) NULL,
    `sub_role_id` VARCHAR(191) NULL,
    `role_tag` ENUM('HR', 'INTERVIEWER', 'RECRUITER', 'TRAINER', 'FINANCE') NULL,
    `reset_password_token` VARCHAR(191) NULL,
    `reset_password_expires` DATETIME(3) NULL,

    UNIQUE INDEX `Users_username_key`(`username`),
    UNIQUE INDEX `Users_email_key`(`email`),
    UNIQUE INDEX `Users_reset_password_token_key`(`reset_password_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employees` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `employee_number` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NULL,
    `position` VARCHAR(191) NOT NULL,
    `date_of_birth` DATETIME(3) NOT NULL,
    `hire_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `father_name` VARCHAR(191) NULL,
    `manager_id` VARCHAR(191) NULL,
    `skills` VARCHAR(191) NULL,
    `sub_department_id` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `emergency_contact_name` VARCHAR(191) NOT NULL,
    `emergency_contact_phone` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `salary` DECIMAL(10, 2) NOT NULL,
    `work_location` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NULL,
    `shift_id` VARCHAR(191) NULL,
    `profile_image_url` VARCHAR(191) NULL,
    `images` JSON NULL,
    `documents` JSON NULL,

    UNIQUE INDEX `Employees_user_id_key`(`user_id`),
    UNIQUE INDEX `Employees_employee_number_key`(`employee_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubDepartments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `department_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SubDepartments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceRecords` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `clock_in` DATETIME(3) NOT NULL,
    `clock_out` DATETIME(3) NULL,
    `shift_id` VARCHAR(191) NOT NULL,
    `absence_reason` VARCHAR(191) NULL,
    `net_working_minutes` INTEGER NULL,
    `late_minutes` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shifts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Shifts_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequests` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `leave_type_id` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_by_id` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveTypes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `is_paid` BOOLEAN NOT NULL DEFAULT true,
    `total_days` INTEGER NOT NULL,

    UNIQUE INDEX `LeaveTypes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Breaks` (
    `id` VARCHAR(191) NOT NULL,
    `attendance_record_id` VARCHAR(191) NOT NULL,
    `break_start` DATETIME(3) NOT NULL,
    `break_end` DATETIME(3) NULL,
    `break_type_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notifications` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visibility_level` INTEGER NULL,
    `department_id` VARCHAR(191) NULL,
    `sub_department_id` VARCHAR(191) NULL,
    `employee_id` VARCHAR(191) NULL,
    `scope` ENUM('DIRECT', 'TEAMLEADS_SUBDEPT', 'MANAGERS_DEPT', 'DIRECTORS_HR') NULL,
    `user_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNotifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `notification_id` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceFixRequests` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `request_type` VARCHAR(191) NOT NULL,
    `requested_check_in` DATETIME(3) NULL,
    `requested_check_out` DATETIME(3) NULL,
    `requested_breaks` JSON NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_by_id` VARCHAR(191) NULL,
    `reviewed_at` DATETIME(3) NULL,
    `remarks` VARCHAR(191) NULL,
    `attendance_record_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalaryDetails` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `base_salary` DECIMAL(10, 2) NOT NULL,
    `deductions` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `bonuses` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_pay` DECIMAL(10, 2) NOT NULL,
    `effective_from` DATETIME(3) NOT NULL,
    `effective_to` DATETIME(3) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `updated_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Allowances` (
    `id` VARCHAR(191) NOT NULL,
    `salary_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentCategories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `DocumentCategories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDocuments` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSettings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSettings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holidays` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemLogs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `metadata` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveBalances` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `leave_type_id` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BulkUploads` (
    `id` VARCHAR(191) NOT NULL,
    `uploaded_by_id` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeImages` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BreakTypes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `BreakTypes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vacations` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `vacation_type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `approved_by_id` VARCHAR(191) NOT NULL,
    `approved_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OnboardingProcesses` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `assigned_hr_id` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `OnboardingProcesses_employee_id_key`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resignations` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `resignation_date` DATETIME(3) NOT NULL,
    `last_working_day` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `review_comments` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `clearance_status` VARCHAR(191) NOT NULL,
    `asset_return_status` VARCHAR(191) NOT NULL,
    `processed_by_id` VARCHAR(191) NULL,
    `processed_at` DATETIME(3) NULL,
    `clearance_responsible_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assets` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `serial_number` VARCHAR(191) NOT NULL,
    `assigned_to_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Assets_serial_number_key`(`serial_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResignationAssets` (
    `id` VARCHAR(191) NOT NULL,
    `resignation_id` VARCHAR(191) NOT NULL,
    `asset_id` VARCHAR(191) NOT NULL,
    `return_status` VARCHAR(191) NOT NULL,
    `return_date` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrProcesses` (
    `id` VARCHAR(191) NOT NULL,
    `process_type` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `initiated_by_id` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_role_permissions` ADD CONSTRAINT `sub_role_permissions_sub_role_id_fkey` FOREIGN KEY (`sub_role_id`) REFERENCES `sub_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_role_permissions` ADD CONSTRAINT `sub_role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_sub_role_id_fkey` FOREIGN KEY (`sub_role_id`) REFERENCES `sub_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employees` ADD CONSTRAINT `Employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employees` ADD CONSTRAINT `Employees_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employees` ADD CONSTRAINT `Employees_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `Employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employees` ADD CONSTRAINT `Employees_sub_department_id_fkey` FOREIGN KEY (`sub_department_id`) REFERENCES `SubDepartments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employees` ADD CONSTRAINT `Employees_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shifts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubDepartments` ADD CONSTRAINT `SubDepartments_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecords` ADD CONSTRAINT `AttendanceRecords_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecords` ADD CONSTRAINT `AttendanceRecords_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shifts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequests` ADD CONSTRAINT `LeaveRequests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequests` ADD CONSTRAINT `LeaveRequests_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `LeaveTypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequests` ADD CONSTRAINT `LeaveRequests_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Breaks` ADD CONSTRAINT `Breaks_attendance_record_id_fkey` FOREIGN KEY (`attendance_record_id`) REFERENCES `AttendanceRecords`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Breaks` ADD CONSTRAINT `Breaks_break_type_id_fkey` FOREIGN KEY (`break_type_id`) REFERENCES `BreakTypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotifications` ADD CONSTRAINT `UserNotifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotifications` ADD CONSTRAINT `UserNotifications_notification_id_fkey` FOREIGN KEY (`notification_id`) REFERENCES `Notifications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceFixRequests` ADD CONSTRAINT `AttendanceFixRequests_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceFixRequests` ADD CONSTRAINT `AttendanceFixRequests_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceFixRequests` ADD CONSTRAINT `AttendanceFixRequests_attendance_record_id_fkey` FOREIGN KEY (`attendance_record_id`) REFERENCES `AttendanceRecords`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalaryDetails` ADD CONSTRAINT `SalaryDetails_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Allowances` ADD CONSTRAINT `Allowances_salary_id_fkey` FOREIGN KEY (`salary_id`) REFERENCES `SalaryDetails`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDocuments` ADD CONSTRAINT `EmployeeDocuments_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDocuments` ADD CONSTRAINT `EmployeeDocuments_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `DocumentCategories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SystemLogs` ADD CONSTRAINT `SystemLogs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalances` ADD CONSTRAINT `LeaveBalances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveBalances` ADD CONSTRAINT `LeaveBalances_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `LeaveTypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BulkUploads` ADD CONSTRAINT `BulkUploads_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeImages` ADD CONSTRAINT `EmployeeImages_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacations` ADD CONSTRAINT `Vacations_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacations` ADD CONSTRAINT `Vacations_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OnboardingProcesses` ADD CONSTRAINT `OnboardingProcesses_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OnboardingProcesses` ADD CONSTRAINT `OnboardingProcesses_assigned_hr_id_fkey` FOREIGN KEY (`assigned_hr_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resignations` ADD CONSTRAINT `Resignations_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resignations` ADD CONSTRAINT `Resignations_processed_by_id_fkey` FOREIGN KEY (`processed_by_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resignations` ADD CONSTRAINT `Resignations_clearance_responsible_id_fkey` FOREIGN KEY (`clearance_responsible_id`) REFERENCES `Users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assets` ADD CONSTRAINT `Assets_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResignationAssets` ADD CONSTRAINT `ResignationAssets_resignation_id_fkey` FOREIGN KEY (`resignation_id`) REFERENCES `Resignations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResignationAssets` ADD CONSTRAINT `ResignationAssets_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `Assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HrProcesses` ADD CONSTRAINT `HrProcesses_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HrProcesses` ADD CONSTRAINT `HrProcesses_initiated_by_id_fkey` FOREIGN KEY (`initiated_by_id`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
