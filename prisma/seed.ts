import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ———————————————————————————————————————————————————————————
  // 0) Config: change if you want different defaults in prod
  // ———————————————————————————————————————————————————————————
  const ADMIN_EMAIL = 'admin@pegahub.com';
  const ADMIN_USERNAME = 'admin';
  const ADMIN_FULLNAME = 'System Admin';
  const ADMIN_PASSWORD = 'admin123'; // rotate in prod / env var
  const ADMIN_STATUS = 'ACTIVE';

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // ———————————————————————————————————————————————————————————
  // 1) Role: 'admin' (case-sensitive)
  // ———————————————————————————————————————————————————————————
  const adminRole = await prisma.roles.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Admin role with All access',
    },
  });

  // ———————————————————————————————————————————————————————————
  // 2) Permissions (module + action composite unique)
  // Only seed-time perms; later perms created via dashboard
  // ———————————————————————————————————————————————————————————
  const permissionsData: Array<{
    module: string;
    action: string;
    description?: string | null;
  }> = [
      { module: 'Dashboard', action: 'view', description: 'Access Dashboard' },

      { module: 'Permission', action: 'view', description: 'View permissions' },
      { module: 'Permission', action: 'create', description: 'Create permissions' },
      { module: 'Permission', action: 'update', description: 'Update permissions' },
      { module: 'Permission', action: 'delete', description: 'Delete permissions' },

      { module: 'Salary', action: 'view-all', description: 'view-all Salary' },
      { module: 'Salary', action: 'create', description: 'create Salary' },
      { module: 'Salary', action: 'update', description: 'update Salary' },
      { module: 'Salary', action: 'delete', description: 'delete Salary' },
      { module: 'Salary', action: 'approve', description: 'approve Salary' },
      { module: 'Salary', action: 'view', description: 'view Salary' },

      { module: 'Role', action: 'view-all', description: 'view-all Role' },
      { module: 'Role', action: 'view', description: 'view Role' },
      { module: 'Role', action: 'create', description: 'create Role' },
      { module: 'Role', action: 'update', description: 'update Role' },
      { module: 'Role', action: 'delete', description: 'delete Role' },
      { module: 'Role', action: 'approve', description: 'approve Role' },

      { module: 'SubDepartment', action: 'view-all', description: 'view-all SubDepartment' },
      { module: 'SubDepartment', action: 'view', description: 'view SubDepartment' },
      { module: 'SubDepartment', action: 'create', description: 'create SubDepartment' },
      { module: 'SubDepartment', action: 'update', description: 'update SubDepartment' },
      { module: 'SubDepartment', action: 'delete', description: 'delete SubDepartment' },
      { module: 'SubDepartment', action: 'approve', description: 'approve SubDepartment' },

      { module: 'FixAttendance', action: 'view-all', description: 'view-all FixAttendance' },
      { module: 'FixAttendance', action: 'view', description: 'view FixAttendance' },
      { module: 'FixAttendance', action: 'create', description: 'create FixAttendance' },
      { module: 'FixAttendance', action: 'update', description: 'update FixAttendance' },
      { module: 'FixAttendance', action: 'delete', description: 'delete FixAttendance' },
      { module: 'FixAttendance', action: 'approve', description: 'approve FixAttendance' },

      { module: 'Bid', action: 'view', description: 'view Bid' },
      { module: 'Bid', action: 'create', description: 'create Bid' },

      { module: 'Employee', action: 'view-all', description: 'view-all Employee' },
      { module: 'Employee', action: 'view', description: 'view Employee' },
      { module: 'Employee', action: 'create', description: 'create Employee' },
      { module: 'Employee', action: 'update', description: 'update Employee' },
      { module: 'Employee', action: 'delete', description: 'delete Employee' },
      { module: 'Employee', action: 'approve', description: 'approve Employee' },

      { module: 'Notification', action: 'view', description: 'view Notification' },

      { module: 'Department', action: 'view-all', description: 'view-all Department' },
      { module: 'Department', action: 'view', description: 'view Department' },
      { module: 'Department', action: 'create', description: 'create Department' },
      { module: 'Department', action: 'update', description: 'update Department' },
      { module: 'Department', action: 'delete', description: 'delete Department' },
      { module: 'Department', action: 'approve', description: 'approve Department' },

      { module: 'Designation', action: 'view-all', description: 'view-all Designation' },
      { module: 'Designation', action: 'view', description: 'view Designation' },
      { module: 'Designation', action: 'create', description: 'create Designation' },
      { module: 'Designation', action: 'update', description: 'update Designation' },
      { module: 'Designation', action: 'delete', description: 'delete Designation' },
      { module: 'Designation', action: 'approve', description: 'approve Designation' },

      { module: 'SubRole', action: 'view-all', description: 'view-all SubRole' },
      { module: 'SubRole', action: 'view', description: 'view SubRole' },
      { module: 'SubRole', action: 'create', description: 'create SubRole' },
      { module: 'SubRole', action: 'update', description: 'update SubRole' },
      { module: 'SubRole', action: 'delete', description: 'delete SubRole' },
      { module: 'SubRole', action: 'approve', description: 'approve SubRole' },

      { module: 'Shift', action: 'view-all', description: 'view-all Shift' },
      { module: 'Shift', action: 'view', description: 'view Shift' },
      { module: 'Shift', action: 'create', description: 'create Shift' },
      { module: 'Shift', action: 'update', description: 'update Shift' },
      { module: 'Shift', action: 'delete', description: 'delete Shift' },
      { module: 'Shift', action: 'approve', description: 'approve Shift' },

      { module: 'Setting', action: 'view', description: 'view Setting' },
      { module: 'Setting', action: 'create', description: 'create Setting' },

      { module: 'Ticket', action: 'view', description: 'view Ticket' },
      { module: 'Ticket', action: 'create', description: 'create Ticket' },

      { module: 'Milestone', action: 'view', description: 'view Milestone' },
      { module: 'Milestone', action: 'create', description: 'create Milestone' },
      { module: 'Milestone', action: 'update', description: 'update Milestone' },

      { module: 'Attendance', action: 'view-all', description: 'view-all Attendance' },
      { module: 'Attendance', action: 'view', description: 'view Attendance' },
      { module: 'Attendance', action: 'create', description: 'create Attendance' },
      { module: 'Attendance', action: 'update', description: 'update Attendance' },
      { module: 'Attendance', action: 'delete', description: 'delete Attendance' },
      { module: 'Attendance', action: 'approve', description: 'approve Attendance' },

      { module: 'Leave', action: 'view-all', description: 'view-all Leave' },
      { module: 'Leave', action: 'view', description: 'view Leave' },
      { module: 'Leave', action: 'create', description: 'create Leave' },
      { module: 'Leave', action: 'update', description: 'update Leave' },
      { module: 'Leave', action: 'delete', description: 'delete Leave' },
      { module: 'Leave', action: 'approve', description: 'approve Leave' },

      { module: 'Project', action: 'view', description: 'view Project' },
      { module: 'Project', action: 'create', description: 'create Project' },

      { module: 'Upwork', action: 'view-all', description: 'view-all Upwork' },
      { module: 'Upwork', action: 'view', description: 'view Upwork' },
      { module: 'Upwork', action: 'create', description: 'create Upwork' },
      { module: 'Upwork', action: 'update', description: 'update Upwork' },
      { module: 'Upwork', action: 'delete', description: 'delete Upwork' },
      { module: 'Upwork', action: 'approve', description: 'approve Upwork' },


      // add any missing ones similarly...
    ];

  // Explicitly type to avoid never[] issues; we only need id later
  const seededPermissions: Array<{ id: string }> = [];

  for (const perm of permissionsData) {
    const created = await prisma.permissions.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: perm,
    });
    seededPermissions.push({ id: created.id });
  }

  // ———————————————————————————————————————————————————————————
  // 3) Admin user (no subRole for admin)
  // ———————————————————————————————————————————————————————————
  const adminUser = await prisma.users.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      full_name: ADMIN_FULLNAME,
      email: ADMIN_EMAIL,
      password_hash,
      role_id: adminRole.id,
      status: ADMIN_STATUS,
    },
  });

  // ———————————————————————————————————————————————————————————
  // 4) Assign permissions to admin role & admin user
  // (only the permissions seeded above)
  // ———————————————————————————————————————————————————————————
  for (const perm of seededPermissions) {
    // Role -> Permission
    await prisma.role_permissions.upsert({
      where: {
        roleId_permissionId: {
          role_id: adminRole.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: perm.id,
      },
    });

    const headDepartments = [
      { name: 'Production', description: 'Production Head Department', code: 'PROD' },
      { name: 'Finance', description: 'Finance Head Department', code: 'FIN' },
      { name: 'Commercial', description: 'Commercial Head Department', code: 'COM' },
      { name: 'HR', description: 'Human Resource Head Department', code: 'HR' },
      { name: 'IT', description: 'Information Technology Head Department', code: 'IT' },
    ];

    for (const hd of headDepartments) {
      await prisma.head_departments.upsert({
        where: { name: hd.name },
        update: {},
        create: hd,
      });
    }

    // User -> Permission
    await prisma.user_permissions.upsert({
      where: {
        userId_permissionId: {
          user_id: adminUser.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        permission_id: perm.id,
      },
    });
  }

  console.log('Seeding done: admin role/user created, base permissions seeded & assigned.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
