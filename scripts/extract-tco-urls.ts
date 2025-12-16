import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start extracting t.co URLs from content...');

    const tweets = await prisma.tweet.findMany();
    console.log(`Found ${tweets.length} tweets.`);

    let updatedCount = 0;

    for (const tweet of tweets) {
        // Regex to find t.co link at the end of the string
        // allowing for optional trailing whitespace
        const match = tweet.content.match(/(https:\/\/t\.co\/[a-zA-Z0-9]+)\s*$/);

        if (match) {
            const tcoUrl = match[1];

            // Update if the URL is different
            if (tweet.url !== tcoUrl) {
                await prisma.tweet.update({
                    where: { id: tweet.id },
                    data: { url: tcoUrl }
                });
                updatedCount++;

                if (updatedCount % 100 === 0) {
                    console.log(`Updated ${updatedCount} tweets...`);
                }
            }
        }
    }

    console.log(`Finished! Updated ${updatedCount} tweets with t.co URLs.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
