import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ImportTweetPayload } from '@/lib/types';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // 1. Security Check: Validate Extension Token
  const token = req.headers.get('x-extension-token');
  const expectedToken = process.env.EXTENSION_TOKEN;

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Security Check: Ensure Admin User ID is configured
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    console.error('ADMIN_USER_ID is not defined in .env');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const payload: ImportTweetPayload = await req.json();

    // 3. Validation (Basic)
    if (!payload.id || !payload.content || !payload.authorHandle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Database Operation: Upsert Tweet
    // Force ownerId to ADMIN_USER_ID
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
        ownerId: adminUserId, // 👈 Forced Ownership
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
  } finally {
    await prisma.$disconnect();
  }
}
