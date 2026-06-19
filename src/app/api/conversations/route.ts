import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const userId = req.nextUrl.searchParams.get('userId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const where: Record<string, string> = { workspaceId };
    if (userId) where.userId = userId;

    const conversations = await prisma.chatConversation.findMany({
      where,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content?.slice(0, 100) || null,
      messageCount: c.messages.length,
    })));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, workspaceId, userId } = await req.json();
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'workspaceId and userId required' }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        title: title || 'New conversation',
        workspaceId,
        userId,
      },
    });

    return NextResponse.json(conversation);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
