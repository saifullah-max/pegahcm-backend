import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            description: 'Regular user with limited permissions',
        },
    });

    await prisma.role.upsert({
        where: { name: 'hr' },
        update: {},
        create: {
            name: 'hr',
            description: 'Human Resources staff with specific permissions',
        },
    });

    console.log('Roles seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
