import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// 获取当前用户的所有 token
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      token: true,
      createdAt: true,
      lastUsed: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tokens });
}

// 创建新 token
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  
  // 生成随机 token
  const token = `xlb_${crypto.randomBytes(24).toString('hex')}`;

  const apiToken = await prisma.apiToken.create({
    data: {
      token,
      name: name || 'Default',
      userId: session.user.id,
    },
  });

  return NextResponse.json({ 
    id: apiToken.id,
    token: apiToken.token,
    name: apiToken.name,
  });
}

// 删除 token
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get('id');

  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
  }

  // 确保只能删除自己的 token
  await prisma.apiToken.deleteMany({
    where: {
      id: tokenId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
