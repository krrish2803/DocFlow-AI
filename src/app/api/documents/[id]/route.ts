import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await prisma.generatedDocument.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, content, status, isPublished, docType } = body;

    const existing = await prisma.generatedDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const slug = title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'
      : existing.slug;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (content !== undefined) data.content = content;
    if (status !== undefined) data.status = status;
    if (isPublished !== undefined) data.isPublished = isPublished;
    if (docType !== undefined) data.docType = docType;
    data.slug = slug;
    data.version = { increment: 1 };

    await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: existing.version,
        title: existing.title,
        content: existing.content,
        description: existing.description,
      },
    });

    const doc = await prisma.generatedDocument.update({ where: { id }, data });
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.generatedDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    await prisma.generatedDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
