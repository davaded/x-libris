import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

const ITEMS_PER_PAGE = 20;

export async function fetchFilteredTweets(
    query: string,
    currentPage: number,
    folder?: string,
) {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    try {
        const where: any = {};

        if (query) {
            where.OR = [
                { content: { contains: query, mode: 'insensitive' } },
                { authorName: { contains: query, mode: 'insensitive' } },
                { authorHandle: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (folder && folder !== 'all') {
            where.folder = folder;
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
    try {
        const totalTweets = await prisma.tweet.count();
        const unsortedCount = await prisma.tweet.count({ where: { folder: 'Unsorted' } });

        const folderGroups = await prisma.tweet.groupBy({
            by: ['folder'],
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
