import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start fixing URLs...');

    // Find all tweets where url is null or empty
    const tweets = await prisma.tweet.findMany({
        where: {
            OR: [
                { url: null },
                { url: '' }
            ]
        }
    });

    console.log(`Found ${tweets.length} tweets with missing URLs.`);

    let updatedCount = 0;

    for (const tweet of tweets) {
        let url = '';

        if (tweet.authorHandle) {
            url = `https://x.com/${tweet.authorHandle}/status/${tweet.id}`;
        } else {
            url = `https://x.com/i/web/status/${tweet.id}`;
        }

        await prisma.tweet.update({
            where: { id: tweet.id },
            data: { url }
        });

        updatedCount++;
        if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} tweets...`);
        }
    }

    console.log(`Finished! Updated ${updatedCount} tweets.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
