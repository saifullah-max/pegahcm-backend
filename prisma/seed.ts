import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subRoles = ['director', 'manager', 'teamLead', 'teamMember'];

  for (const role of subRoles) {
    await prisma.subRole.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  console.log('✅ SubRoles seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding subRoles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
