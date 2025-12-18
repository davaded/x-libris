import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 检查用户
  const users = await prisma.user.findMany({
    select: { id: true, username: true }
  });
  console.log('Users:', users);

  // 检查 tokens
  const tokens = await prisma.apiToken.findMany({
    include: { user: { select: { username: true } } }
  });
  console.log('API Tokens:', tokens);

  // 检查推文
  const tweets = await prisma.tweet.findMany({
    take: 5,
    select: { id: true, ownerId: true, authorHandle: true, source: true }
  });
  console.log('Sample Tweets:', tweets);

  // 统计
  const tweetCount = await prisma.tweet.count();
  console.log('Total tweets:', tweetCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
