import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const migrations: any[] = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
    `;
        console.log('Recent Migrations:', migrations);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
