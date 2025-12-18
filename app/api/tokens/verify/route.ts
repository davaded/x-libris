import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 验证 token 是否有效（供扩展测试用）
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-extension-token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 });
  }

  const apiToken = await prisma.apiToken.findUnique({
    where: { token },
    include: { user: { select: { username: true } } },
  });

  if (!apiToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json({ 
    valid: true, 
    username: apiToken.user.username 
  });
}
