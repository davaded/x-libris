import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = process.argv[2];
    const password = process.argv[3];
    const adminId = process.env.ADMIN_USER_ID;

    if (!username || !password) {
        console.error('Usage: npx tsx scripts/create-admin.ts <username> <password>');
        process.exit(1);
    }

    if (!adminId) {
        console.error('Error: ADMIN_USER_ID is not set in .env');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { id: adminId },
            update: {
                username,
                passwordHash: hashedPassword,
            },
            create: {
                id: adminId,
                username,
                passwordHash: hashedPassword,
            },
        });
        console.log(`Admin user '${user.username}' created/updated successfully.`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
