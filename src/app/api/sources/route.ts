import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUrl } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const sources = await prisma.sourceConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(sources);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceType, label, repositoryUrl, token, workspaceId } = body;
    if (!sourceType || !label || !workspaceId) {
      return NextResponse.json({ error: 'sourceType, label, and workspaceId required' }, { status: 400 });
    }

    const urlErr = validateUrl(repositoryUrl);
    if (urlErr) return NextResponse.json({ error: urlErr }, { status: 400 });

    const source = await prisma.sourceConnection.create({
      data: { sourceType, label, repositoryUrl, token: token || null, workspaceId, contentVolume: 0 },
    });
    return NextResponse.json(source, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
