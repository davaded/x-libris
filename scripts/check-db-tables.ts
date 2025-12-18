import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // List all tables
        const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
        console.log('Tables in DB:', tables.map(t => t.table_name));

        // Count rows in Tweet table
        const count = await prisma.tweet.count();
        console.log(`Rows in Tweet table: ${count}`);

        // Check if there are other tables that look like backups
        for (const t of tables) {
            if (t.table_name !== 'Tweet' && t.table_name !== '_prisma_migrations') {
                try {
                    const c: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${t.table_name}"`);
                    console.log(`Rows in ${t.table_name}:`, c[0].count.toString());
                } catch (e) {
                    console.log(`Could not count ${t.table_name}`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
