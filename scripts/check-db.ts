import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.tweet.count();
        console.log(`Total Tweets in DB: ${count}`);

        const folders = await prisma.tweet.groupBy({
            by: ['folder'],
            _count: {
                folder: true
            }
        });
        console.log('Folder breakdown:', folders);

        const sample = await prisma.tweet.findFirst();
        console.log('Sample Tweet:', sample);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
