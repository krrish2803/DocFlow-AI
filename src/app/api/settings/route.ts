import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, slug: true, aiApiKey: true, aiProvider: true, aiModel: true },
    });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    return NextResponse.json({
      name: ws.name,
      slug: ws.slug,
      aiProvider: ws.aiProvider,
      aiModel: ws.aiModel,
      hasApiKey: !!ws.aiApiKey,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, aiApiKey, aiModel, name } = body;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const data: Record<string, unknown> = {
      aiProvider: 'nvidia',
      aiModel: aiModel || 'meta/llama-3.1-8b-instruct',
    };

    if (aiApiKey !== undefined) data.aiApiKey = aiApiKey || null;
    if (name !== undefined && name.trim()) {
      data.name = name.trim();
      data.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || undefined;
    }

    await prisma.workspace.update({ where: { id: workspaceId }, data });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
