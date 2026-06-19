import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const docs = await prisma.generatedDocument.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(docs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, docType, content, workspaceId } = body;
    if (!title || !workspaceId) {
      return NextResponse.json({ error: 'title and workspaceId required' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
    const doc = await prisma.generatedDocument.create({
      data: { title, slug, description, docType: docType || 'readme', content: content || '', workspaceId },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
