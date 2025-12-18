import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

const ITEMS_PER_PAGE = 20;

export async function fetchFilteredTweets(
    query: string,
    currentPage: number,
    folder?: string,
    source?: string,
) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // 获取当前登录用户
    const session = await auth();
    const userId = session?.user?.id;

    try {
        const where: any = {};

        // 只显示当前用户的推文
        if (userId) {
            where.ownerId = userId;
        }

        if (query) {
            where.OR = [
                { content: { contains: query, mode: 'insensitive' } },
                { authorName: { contains: query, mode: 'insensitive' } },
                { authorHandle: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (folder && folder !== 'All') {
            where.folder = folder;
        }

        // 按来源过滤
        if (source && source !== 'all') {
            where.source = source;
        }

        const dbTweets = await prisma.tweet.findMany({
            where,
            orderBy: { tweetedAt: 'desc' },
            take: ITEMS_PER_PAGE,
            skip: offset,
        });

        const tweets = dbTweets.map(t => ({
            id: t.id,
            user: {
                name: t.authorName,
                handle: t.authorHandle,
                avatar: t.authorAvatar || '',
            },
            folder: t.folder,
            source: t.source,
            content: t.content,
            media: t.mediaUrls.length > 0 ? {
                type: 'image',
                count: t.mediaUrls.length,
                url: t.mediaUrls[0]
            } : null,
            stats: {
                views: 0,
                retweets: t.retweetCount,
                likes: t.likeCount,
                replies: t.replyCount
            },
            date: t.tweetedAt.toISOString().split('T')[0],
            lastUpdated: 'Synced',
            hashtags: t.hashtags,
            url: t.url || undefined
        }));

        const totalCount = await prisma.tweet.count({ where });
        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

        return { tweets, totalPages, totalCount };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch tweets.');
    }
}

export async function fetchTweetStats() {
    // 获取当前登录用户
    const session = await auth();
    const userId = session?.user?.id;

    const userFilter = userId ? { ownerId: userId } : {};

    try {
        const totalTweets = await prisma.tweet.count({ where: userFilter });
        const unsortedCount = await prisma.tweet.count({ 
            where: { ...userFilter, folder: 'Unsorted' } 
        });

        const folderGroups = await prisma.tweet.groupBy({
            by: ['folder'],
            where: userFilter,
            _count: {
                folder: true
            }
        });

        const stats = {
            total: totalTweets,
            unsorted: unsortedCount,
            folders: folderGroups.map(g => ({ name: g.folder, count: g._count.folder }))
        };

        return stats;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch tweet stats.');
    }
}
