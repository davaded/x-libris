import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const [total, unsorted, folderGroups, sourceGroups] = await Promise.all([
      prisma.tweet.count({ where: { ownerId: userId } }),
      prisma.tweet.count({ where: { ownerId: userId, folder: 'Unsorted' } }),
      prisma.tweet.groupBy({
        by: ['folder'],
        where: { ownerId: userId },
        _count: { folder: true }
      }),
      prisma.tweet.groupBy({
        by: ['source'],
        where: { ownerId: userId },
        _count: { source: true }
      })
    ]);

    return NextResponse.json({
      total,
      unsorted,
      folders: folderGroups.map(g => ({ name: g.folder, count: g._count.folder })),
      sources: sourceGroups.map(g => ({ name: g.source, count: g._count.source }))
    });
  } catch (error) {
    console.error('[stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
