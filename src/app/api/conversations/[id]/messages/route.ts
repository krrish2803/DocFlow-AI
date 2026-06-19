import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { role, content, citations } = await req.json();

    if (!role || !content) {
      return NextResponse.json({ error: 'role and content required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        role,
        content,
        citations: citations ? JSON.stringify(citations) : null,
        conversationId: id,
      },
    });

    await prisma.chatConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
