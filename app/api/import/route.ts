import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const instructions = body.instructions || [];
        let count = 0;

        for (const instruction of instructions) {
            if (instruction.type === 'TimelineAddEntries') {
                for (const entry of instruction.entries) {
                    // Check for tweet_results in itemContent
                    const itemContent = entry.content?.itemContent;
                    if (!itemContent) continue;

                    const tweetResult = itemContent.tweet_results?.result;
                    if (!tweetResult) continue;

                    // Handle case where result is a wrapper (e.g. GraphQL union)
                    // Sometimes it's result.tweet (if it's a TweetWithVisibilityResults etc)
                    // But usually for Timeline it's the tweet object directly or legacy
                    const result = tweetResult.tweet || tweetResult;

                    const legacy = result.legacy;
                    const core = result.core;

                    if (!legacy || !core) continue;

                    const id = result.rest_id;
                    if (!id) continue;

                    const userLegacy = core.user_results?.result?.legacy || {};

                    const content = legacy.full_text || '';
                    const authorName = userLegacy.name || '';
                    const authorHandle = userLegacy.screen_name || '';
                    const authorAvatar = userLegacy.profile_image_url_https || '';

                    const media = legacy.entities?.media || [];
                    const mediaUrls = media.map((m: any) => m.media_url_https);

                    const stats = {
                        views: result.views?.count ? parseInt(result.views.count) : 0,
                        likes: legacy.favorite_count || 0,
                        retweets: legacy.retweet_count || 0,
                        replies: legacy.reply_count || 0,
                    };

                    const tweetedAt = new Date(legacy.created_at);

                    // Auto-tagging logic
                    let folder = 'Unsorted';
                    const lowerContent = content.toLowerCase();
                    if (lowerContent.includes('ai') || lowerContent.includes('gpt') || lowerContent.includes('llm')) {
                        folder = 'AI';
                    } else if (lowerContent.includes('github') || lowerContent.includes('code') || lowerContent.includes('dev')) {
                        folder = 'Dev';
                    } else if (lowerContent.includes('design') || lowerContent.includes('ui') || lowerContent.includes('ux')) {
                        folder = 'Design';
                    }

                    await prisma.tweet.upsert({
                        where: { id },
                        update: {
                            stats: stats,
                        },
                        create: {
                            id,
                            content,
                            authorName,
                            authorHandle,
                            authorAvatar,
                            mediaUrls,
                            folder,
                            stats,
                            tweetedAt,
                        },
                    });
                    count++;
                }
            }
        }

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
