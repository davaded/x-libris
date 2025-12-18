import { PrismaClient } from '@prisma/client';

// Try connecting to localhost with default credentials
const localUrl = 'postgresql://postgres:postgres@localhost:5432/x_manager';
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: localUrl
        }
    }
});

async function main() {
    console.log(`Checking local DB at ${localUrl}...`);
    try {
        const count = await prisma.tweet.count();
        console.log(`FOUND LOCAL DATA! Total Tweets: ${count}`);
    } catch (e) {
        console.log('Could not connect to local DB or table not found.');
        // console.error(e); // Suppress full error for cleaner output
    } finally {
        await prisma.$disconnect();
    }
}

main();
