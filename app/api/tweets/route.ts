import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;

    // 筛选参数
    const source = searchParams.get('source');
    const folder = searchParams.get('folder');
    const search = searchParams.get('search');

    // 构建查询条件
    const where: any = {};
    
    if (source && source !== 'all') {
      where.source = source;
    }
    if (folder && folder !== 'All') {
      where.folder = folder;
    }
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
        { authorHandle: { contains: search, mode: 'insensitive' } },
        { hashtags: { has: search } }
      ];
    }

    // 并行查询：数据 + 总数 + 来源统计
    const [tweets, total, sourceCounts] = await Promise.all([
      // 分页数据
      prisma.tweet.findMany({
        where,
        orderBy: { tweetedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      // 总数
      prisma.tweet.count({ where }),
      // 来源统计（全局）
      prisma.tweet.groupBy({
        by: ['source'],
        _count: { _all: true }
      }).catch(() => []) // 兼容旧版 Prisma
    ]);

    // 格式化推文
    const formattedTweets = tweets.map((t: any) => {
      const stats = t.stats as any || {};
      return {
        id: t.id,
        url: t.url,
        user: {
          name: t.authorName,
          handle: t.authorHandle.startsWith('@') ? t.authorHandle : '@' + t.authorHandle,
          avatar: t.authorAvatar
        },
        folder: t.folder,
        source: t.source,
        hashtags: t.hashtags,
        content: t.content,
        media: t.mediaUrls.length > 0 ? {
          type: 'image',
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

    // 格式化来源统计
    const sourceCountsMap: Record<string, number> = {};
    if (Array.isArray(sourceCounts)) {
      sourceCounts.forEach((item: any) => {
        sourceCountsMap[item.source] = item._count?._all || 0;
      });
    }

    return NextResponse.json({
      tweets: formattedTweets,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      sourceCounts: sourceCountsMap
    });

  } catch (error) {
    console.error('[tweets] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
  }
}

function formatNumber(num: number | undefined) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
