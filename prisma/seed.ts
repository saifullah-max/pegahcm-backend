import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create Admin Role if not exists
    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            description: 'User with limited access',
        },
    });

    // Hash password
    const password = 'admin123'; // 🔐 change this later
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Admin User
    const User = await prisma.user.upsert({
        where: { username: 'user' },
        update: {},
        create: {
            username: 'user',
            passwordHash,
            email: 'user@example.com',
            fullName: 'user 1',
            roleId: userRole.id,
            status: 'active',
        },
    });

    console.log(`✅ User user created: ${User.username}`);
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
