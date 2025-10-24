import { PermissionSource, PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ADMIN_EMAIL = "admin@pegahub.com";
  const ADMIN_USERNAME = "admin";
  const ADMIN_FULLNAME = "System Admin";
  const ADMIN_PASSWORD = "admin123";
  const ADMIN_STATUS = "ACTIVE";

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminRole = await prisma.roles.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Admin role with All access",
    },
  });

  const permissionsData: Array<{
    module: string;
    action: string;
    description?: string | null;
  }> = [
      { module: "Dashboard", action: "view", description: "Access Dashboard" },

      { module: "Permission", action: "view", description: "View permissions" },
      {
        module: "Permission",
        action: "create",
        description: "Create permissions",
      },
      {
        module: "Permission",
        action: "update",
        description: "Update permissions",
      },
      {
        module: "Permission",
        action: "delete",
        description: "Delete permissions",
      },

      { module: "Salary", action: "view-all", description: "view-all Salary" },
      { module: "Salary", action: "create", description: "create Salary" },
      { module: "Salary", action: "update", description: "update Salary" },
      { module: "Salary", action: "delete", description: "delete Salary" },
      { module: "Salary", action: "approve", description: "approve Salary" },
      { module: "Salary", action: "view", description: "view Salary" },

      { module: "Role", action: "view-all", description: "view-all Role" },
      { module: "Role", action: "view", description: "view Role" },
      { module: "Role", action: "create", description: "create Role" },
      { module: "Role", action: "update", description: "update Role" },
      { module: "Role", action: "delete", description: "delete Role" },
      { module: "Role", action: "approve", description: "approve Role" },

      {
        module: "SubDepartment",
        action: "view-all",
        description: "view-all SubDepartment",
      },
      {
        module: "SubDepartment",
        action: "view",
        description: "view SubDepartment",
      },
      {
        module: "SubDepartment",
        action: "create",
        description: "create SubDepartment",
      },
      {
        module: "SubDepartment",
        action: "update",
        description: "update SubDepartment",
      },
      {
        module: "SubDepartment",
        action: "delete",
        description: "delete SubDepartment",
      },
      {
        module: "SubDepartment",
        action: "approve",
        description: "approve SubDepartment",
      },

      {
        module: "FixAttendance",
        action: "view-all",
        description: "view-all FixAttendance",
      },
      {
        module: "FixAttendance",
        action: "view",
        description: "view FixAttendance",
      },
      {
        module: "FixAttendance",
        action: "create",
        description: "create FixAttendance",
      },
      {
        module: "FixAttendance",
        action: "update",
        description: "update FixAttendance",
      },
      {
        module: "FixAttendance",
        action: "delete",
        description: "delete FixAttendance",
      },
      {
        module: "FixAttendance",
        action: "approve",
        description: "approve FixAttendance",
      },

      { module: "Bid", action: "view-all", description: "view-all Bid" },
      { module: "Bid", action: "view", description: "view Bid" },
      { module: "Bid", action: "view-own", description: "view own Bid" },
      { module: "Bid", action: "create", description: "create Bid" },

      {
        module: "Employee",
        action: "view-all",
        description: "view-all Employee",
      },
      { module: "Employee", action: "view", description: "view Employee" },
      { module: "Employee", action: "create", description: "create Employee" },
      { module: "Employee", action: "update", description: "update Employee" },
      { module: "Employee", action: "delete", description: "delete Employee" },
      { module: "Employee", action: "approve", description: "approve Employee" },

      {
        module: "Notification",
        action: "view",
        description: "view Notification",
      },

      {
        module: "Department",
        action: "view-all",
        description: "view-all Department",
      },
      { module: "Department", action: "view", description: "view Department" },
      {
        module: "Department",
        action: "create",
        description: "create Department",
      },
      {
        module: "Department",
        action: "update",
        description: "update Department",
      },
      {
        module: "Department",
        action: "delete",
        description: "delete Department",
      },
      {
        module: "Department",
        action: "approve",
        description: "approve Department",
      },

      {
        module: "Designation",
        action: "view-all",
        description: "view-all Designation",
      },
      { module: "Designation", action: "view", description: "view Designation" },
      {
        module: "Designation",
        action: "create",
        description: "create Designation",
      },
      {
        module: "Designation",
        action: "update",
        description: "update Designation",
      },
      {
        module: "Designation",
        action: "delete",
        description: "delete Designation",
      },
      {
        module: "Designation",
        action: "approve",
        description: "approve Designation",
      },

      { module: "SubRole", action: "view-all", description: "view-all SubRole" },
      { module: "SubRole", action: "view", description: "view SubRole" },
      { module: "SubRole", action: "create", description: "create SubRole" },
      { module: "SubRole", action: "update", description: "update SubRole" },
      { module: "SubRole", action: "delete", description: "delete SubRole" },
      { module: "SubRole", action: "approve", description: "approve SubRole" },

      { module: "Shift", action: "view-all", description: "view-all Shift" },
      { module: "Shift", action: "view", description: "view Shift" },
      { module: "Shift", action: "create", description: "create Shift" },
      { module: "Shift", action: "update", description: "update Shift" },
      { module: "Shift", action: "delete", description: "delete Shift" },
      { module: "Shift", action: "approve", description: "approve Shift" },

      { module: "Setting", action: "view", description: "view Setting" },
      { module: "Setting", action: "create", description: "create Setting" },

      { module: "Ticket", action: "view", description: "view Ticket" },
      { module: "Ticket", action: "create", description: "create Ticket" },
      { module: "Ticket", action: "comment", description: "Comment on ticket" },

      { module: "Milestone", action: "view", description: "view Milestone" },
      { module: "Milestone", action: "create", description: "create Milestone" },
      { module: "Milestone", action: "update", description: "update Milestone" },

      {
        module: "Attendance",
        action: "view-all",
        description: "view-all Attendance",
      },
      { module: "Attendance", action: "view", description: "view Attendance" },
      {
        module: "Attendance",
        action: "create",
        description: "create Attendance",
      },
      {
        module: "Attendance",
        action: "update",
        description: "update Attendance",
      },
      {
        module: "Attendance",
        action: "delete",
        description: "delete Attendance",
      },
      {
        module: "Attendance",
        action: "approve",
        description: "approve Attendance",
      },

      { module: "Leave", action: "view-all", description: "view-all Leave" },
      { module: "Leave", action: "view", description: "view Leave" },
      { module: "Leave", action: "create", description: "create Leave" },
      { module: "Leave", action: "update", description: "update Leave" },
      { module: "Leave", action: "delete", description: "delete Leave" },
      { module: "Leave", action: "approve", description: "approve Leave" },

      { module: "Project", action: "view", description: "view Project" },
      { module: "Project", action: "create", description: "create Project" },

      { module: "Upwork", action: "view-all", description: "view-all Upwork" },
      { module: "Upwork", action: "view", description: "view Upwork" },
      { module: "Upwork", action: "create", description: "create Upwork" },
      { module: "Upwork", action: "update", description: "update Upwork" },
      { module: "Upwork", action: "delete", description: "delete Upwork" },
      { module: "Upwork", action: "approve", description: "approve Upwork" },
    ];

  const seededPermissions: Array<{ id: string }> = [];

  for (const perm of permissionsData) {
    const created = await prisma.permissions.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: perm,
    });
    seededPermissions.push({ id: created.id });
  }

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

  for (const perm of seededPermissions) {
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
      {
        name: "Production",
        description: "Production Head Department",
        code: "PROD",
      },
      { name: "Finance", description: "Finance Head Department", code: "FIN" },
      {
        name: "Commercial",
        description: "Commercial Head Department",
        code: "COM",
      },
      { name: "HR", description: "Human Resource Head Department", code: "HR" },
      {
        name: "IT",
        description: "Information Technology Head Department",
        code: "IT",
      },
    ];

    for (const hd of headDepartments) {
      await prisma.head_departments.upsert({
        where: { name: hd.name },
        update: {},
        create: hd,
      });
    }

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
        source: PermissionSource.ROLE, // ✅ added
      },
    });

  }

  // ---------- NEW SEED ADDITIONS ----------
  // create teamMember role
  const teamRole = await prisma.roles.upsert({
    where: { name: "teamMember" },
    update: {},
    create: {
      name: "teamMember",
      description: "Team member role",
    },
  });

  // ensure head departments exist (Production, Commercial) -- they were seeded earlier,
  // but fetch them to get their ids
  const productionHead = await prisma.head_departments.findUnique({ where: { name: "Production" } });
  const commercialHead = await prisma.head_departments.findUnique({ where: { name: "Commercial" } });

  // create departments MERN (head = Production) and Upwork bidding (head = Commercial)
  const mernDept = await prisma.departments.upsert({
    where: { name_head_id: { name: "MERN", head_id: productionHead ? productionHead.id : "" } },
    update: {},
    create: {
      name: "MERN",
      description: "MERN Department",
      head_id: productionHead ? productionHead.id : undefined as any,
    },
  });

  const upworkDept = await prisma.departments.upsert({
    where: { name_head_id: { name: "Upwork bidding", head_id: commercialHead ? commercialHead.id : "" } },
    update: {},
    create: {
      name: "Upwork bidding",
      description: "Upwork Bidding Department",
      head_id: commercialHead ? commercialHead.id : undefined as any,
    },
  });

  // create Shift "Evening" start_time today 15:00, end_time today + 1 year (user requested effective range)
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(15, 0, 0, 0); // 3:00 PM today
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);
  oneYearLater.setHours(0, 0, 0, 0); // midnight on same day next year (effective_to)

  const eveningShift = await prisma.shifts.upsert({
    where: { name: "Evening" },
    update: {
      start_time: startTime,
      end_time: oneYearLater,
      description: "Evening shift 3pm - 12am (effective 1 year)",
    },
    create: {
      name: "Evening",
      start_time: startTime,
      end_time: oneYearLater,
      description: "Evening shift 3pm - 12am (effective 1 year)",
    },
  });

  // create designation (name is not unique in schema) — use findFirst/create
  let srArch = await prisma.designations.findFirst({ where: { name: "Sr.Software architecture" } });
  if (!srArch) {
    srArch = await prisma.designations.create({
      data: {
        name: "Sr.Software architecture",
        description: "Senior Software Architect",
      },
    });
  }

  // create upwork id "Shariq"
  const upworkShariq = await prisma.upwork_ids.upsert({
    where: { name: "Shariq" },
    update: {},
    create: {
      name: "Shariq",
      link: "https://example.com/shariq",
      status: "ACTIVE",
    },
  });

  // create one bid tied to upworkShariq — use Prisma.Decimal for Decimal fields
  const createdBid = await prisma.bids.create({
    data: {
      url: "https://upwork.com/fake-bid-1",
      profile: "ShariqProfile",
      connects: 5,
      boosted_connects: 0,
      total: 100,
      cost: new Prisma.Decimal(100), // proper Decimal
      bid_status: "OPEN",
      id_name: "BID-001",
      description: "Test bid created for seeding",
      client_name: "Example Client",
      price: "100",
      upwork_id: upworkShariq.id,
      price_type: "fixed",
    },
  });

  // create one project linked to the bid
  const project = await prisma.projects.create({
    data: {
      client_name: "Example Client",
      name: "Seeded Project 1",
      description: "Project created via seed",
      start_date: new Date(),
      status: "active",
      bid_id: createdBid.id,
    },
  });

  // create one milestone for project
  const milestone = await prisma.milestones.create({
    data: {
      name: "Initial milestone",
      project_id: project.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      estimated_hours: 40,
      actual_hours: 0,
      status: "open",
      revenue: 0,
    },
  });

  // create one ticket linked to milestone
  const ticket = await prisma.tickets.create({
    data: {
      title: "Seeded Ticket 1",
      description: "A ticket created in seed data",
      milestone_id: milestone.id,
      estimated_hours: 8,
      actual_hours: 0,
      task_type: "bug",
      ticket_number: `SEED-${Date.now()}`,
    },
  });

  // helper to hash password
  const pwHash1 = await bcrypt.hash("Password123!", 10);
  const pwHash2 = await bcrypt.hash("Password123!", 10);

  // find permission Employee:view
  const employeeViewPerm = await prisma.permissions.findUnique({
    where: { module_action: { module: "Employee", action: "view" } },
  });

  // create two users and employees
  const user1 = await prisma.users.upsert({
    where: { email: "Saifullah@pegahub.com" },
    update: {},
    create: {
      username: "Saifullah",
      full_name: "Saifullah",
      email: "Saifullah@pegahub.com",
      password_hash: pwHash1,
      role_id: teamRole.id,
      status: "ACTIVE",
    },
  });

  const emp1 = await prisma.employees.create({
    data: {
      user_id: user1.id,
      employee_number: "EMP1001",
      date_of_birth: new Date("1990-01-01"),
      hire_date: new Date(),
      status: "ACTIVE",
      department_id: mernDept.id,
      designation_id: srArch.id,
      phone_number: "0300-0000-001",
      salary: new Prisma.Decimal(50000), // proper Decimal
      work_location: "Onsite",
      gender: "Male",
      address: "Seeded Address 1",
      shift_id: eveningShift.id,
      // added required emergency contact fields
      emergency_contact_name: "N/A",
      emergency_contact_phone: "0000000000",
    },
  });

  const user2 = await prisma.users.upsert({
    where: { email: "salesTester@pegahub.com" },
    update: {},
    create: {
      username: "salesTester",
      full_name: "Sales Tester",
      email: "salesTester@pegahub.com",
      password_hash: pwHash2,
      role_id: teamRole.id,
      status: "ACTIVE",
    },
  });

  const emp2 = await prisma.employees.create({
    data: {
      user_id: user2.id,
      employee_number: "EMP1002",
      date_of_birth: new Date("1992-02-02"),
      hire_date: new Date(),
      status: "ACTIVE",
      department_id: upworkDept.id,
      designation_id: srArch.id,
      phone_number: "0300-0000-002",
      salary: new Prisma.Decimal(45000), // proper Decimal
      work_location: "Remote",
      gender: "Male",
      address: "Seeded Address 2",
      shift_id: eveningShift.id,
      // added required emergency contact fields
      emergency_contact_name: "N/A",
      emergency_contact_phone: "0000000000",
    },
  });

  // assign Employee:view to both users if permission exists
  if (employeeViewPerm) {
    await prisma.user_permissions.upsert({
      where: { userId_permissionId: { user_id: user1.id, permission_id: employeeViewPerm.id } },
      update: {},
      create: {
        user_id: user1.id,
        permission_id: employeeViewPerm.id,
        source: PermissionSource.USER,
      },
    });

    await prisma.user_permissions.upsert({
      where: { userId_permissionId: { user_id: user2.id, permission_id: employeeViewPerm.id } },
      update: {},
      create: {
        user_id: user2.id,
        permission_id: employeeViewPerm.id,
        source: PermissionSource.USER,
      },
    });
  }

  // ---------- END NEW SEED ADDITIONS ----------
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
