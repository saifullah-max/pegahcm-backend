import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ———————————————————————————————————————————————————————————
  // 0) Config: change if you want different defaults in prod
  // ———————————————————————————————————————————————————————————
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_USERNAME = 'admin';
  const ADMIN_FULLNAME = 'System Admin';
  const ADMIN_PASSWORD = 'admin123'; // rotate in prod / env var
  const ADMIN_STATUS = 'ACTIVE';

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // ———————————————————————————————————————————————————————————
  // 1) Role: 'admin' (case-sensitive)
  // ———————————————————————————————————————————————————————————
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role',
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
    ];

  // Explicitly type to avoid never[] issues; we only need id later
  const seededPermissions: Array<{ id: string }> = [];

  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: perm,
    });
    seededPermissions.push({ id: created.id });
  }

  // ———————————————————————————————————————————————————————————
  // 3) Admin user (no subRole for admin)
  // ———————————————————————————————————————————————————————————
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      fullName: ADMIN_FULLNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      roleId: adminRole.id,
      status: ADMIN_STATUS,
    },
  });

  // ———————————————————————————————————————————————————————————
  // 4) Assign permissions to admin role & admin user
  // (only the permissions seeded above)
  // ———————————————————————————————————————————————————————————
  for (const perm of seededPermissions) {
    // Role -> Permission
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });

    // User -> Permission
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: adminUser.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('✅ Seeding done: admin role/user created, base permissions seeded & assigned.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
