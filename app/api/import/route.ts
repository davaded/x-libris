import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ImportTweetPayload } from '@/lib/types';

export async function POST(req: NextRequest) {
  // 1. Security Check: Validate API Token
  const token = req.headers.get('x-extension-token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 });
  }

  // 2. 查找 token 对应的用户
  const apiToken = await prisma.apiToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!apiToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 更新 token 最后使用时间
  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsed: new Date() },
  });

  const userId = apiToken.userId;

  try {
    const payload: ImportTweetPayload = await req.json();

    // 3. Validation (Basic)
    if (!payload.id || !payload.content || !payload.authorHandle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Database Operation: Upsert Tweet
    // 使用 token 对应的用户 ID
    const tweet = await prisma.tweet.upsert({
      where: { id: payload.id },
      update: {
        // Update fields if tweet exists (e.g. stats updated)
        replyCount: payload.replyCount ?? 0,
        retweetCount: payload.retweetCount ?? 0,
        likeCount: payload.likeCount ?? 0,
        quoteCount: payload.quoteCount ?? 0,
        folder: payload.folder ?? 'Unsorted',
        source: payload.source ?? 'import',
        // Don't overwrite content/AI fields on re-import usually, but here we update stats
      },
      create: {
        id: payload.id,
        ownerId: userId, // 👈 使用 token 对应的用户
        url: payload.url,
        content: payload.content,
        authorName: payload.authorName,
        authorHandle: payload.authorHandle!,
        authorAvatar: payload.authorAvatar,
        mediaUrls: payload.mediaUrls ?? [],
        hashtags: payload.hashtags ?? [],
        replyCount: payload.replyCount ?? 0,
        retweetCount: payload.retweetCount ?? 0,
        likeCount: payload.likeCount ?? 0,
        quoteCount: payload.quoteCount ?? 0,
        folder: payload.folder ?? 'Unsorted',
        source: payload.source ?? 'import',
        tweetedAt: payload.tweetedAt ? new Date(payload.tweetedAt) : new Date(),
        processed: false, // 👈 Trigger Async AI Worker
      },
    });

    return NextResponse.json({ success: true, id: tweet.id });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
