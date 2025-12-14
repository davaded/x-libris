import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取指定来源的所有推文 ID（用于扩展端去重）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');

    const where: any = {};
    if (source && source !== 'all') {
      where.source = source;
    }

    const tweets = await prisma.tweet.findMany({
      where,
      select: { id: true },
    });

    const ids = tweets.map(t => t.id);
    
    console.log('[ids] 返回', ids.length, '个 ID，source:', source || 'all');
    
    return NextResponse.json({ ids, count: ids.length });
  } catch (error) {
    console.error('[ids] 错误:', error);
    return NextResponse.json({ error: 'Failed to fetch IDs' }, { status: 500 });
  }
}
