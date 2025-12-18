import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  
  const tweetCount = session?.user?.id 
    ? await prisma.tweet.count({ where: { ownerId: session.user.id } })
    : 0;

  return NextResponse.json({
    session: {
      user: session?.user,
    },
    tweetCount,
    debug: {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    }
  });
}
