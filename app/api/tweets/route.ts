import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const tweets = await prisma.tweet.findMany({
            orderBy: { tweetedAt: 'desc' },
        });

        // Map to UI format
        const formattedTweets = tweets.map(t => {
            const stats = t.stats as any || {};
            return {
                id: t.id,
                user: {
                    name: t.authorName,
                    handle: t.authorHandle.startsWith('@') ? t.authorHandle : '@' + t.authorHandle,
                    avatar: t.authorAvatar
                },
                folder: t.folder,
                content: t.content,
                media: t.mediaUrls.length > 0 ? {
                    type: 'image', // Simplified
                    count: t.mediaUrls.length,
                    url: t.mediaUrls[0]
                } : null,
                stats: {
                    views: formatNumber(stats.views),
                    retweets: stats.retweets || 0,
                    likes: stats.likes || 0,
                    replies: stats.replies || 0
                },
                date: new Date(t.tweetedAt).toLocaleString(),
                lastUpdated: new Date(t.createdAt).toLocaleString()
            };
        });

        return NextResponse.json(formattedTweets);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
    }
}

function formatNumber(num: number | undefined) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
