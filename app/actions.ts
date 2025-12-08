'use server'
import prisma from '@/lib/prisma'

import { Prisma } from '@prisma/client'

export async function getTweets(query?: string, folder?: string) {
    const where: Prisma.TweetWhereInput = {};

    if (folder && folder !== 'All') {
        where.folder = folder;
    }

    if (query) {
        where.OR = [
            { content: { contains: query, mode: 'insensitive' } },
            { authorName: { contains: query, mode: 'insensitive' } },
            { authorHandle: { contains: query, mode: 'insensitive' } },
        ];
    }

    try {
        const tweets = await prisma.tweet.findMany({
            where,
            orderBy: { tweetedAt: 'desc' },
        });
        return tweets;
    } catch (error) {
        console.error('Error fetching tweets:', error);
        return [];
    }
}

export async function getFolders() {
    try {
        const groups = await prisma.tweet.groupBy({
            by: ['folder'],
            _count: {
                folder: true,
            },
        });

        const folders = groups.map((g) => ({ name: g.folder, count: g._count.folder }));
        const total = folders.reduce((acc, curr) => acc + curr.count, 0);

        return [
            { name: 'All', count: total },
            ...folders.sort((a, b) => b.count - a.count)
        ];
    } catch (error) {
        console.error('Error fetching folders:', error);
        return [{ name: 'All', count: 0 }];
    }
}
