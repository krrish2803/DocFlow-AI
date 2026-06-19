import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, comment, workspaceId } = body;

    const existing = await prisma.review.findUnique({
      where: { id },
      include: { document: { select: { workspaceId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (comment !== undefined) data.comment = comment;

    const review = await prisma.review.update({
      where: { id },
      data,
      include: { reviewer: { select: { id: true, email: true, name: true } } },
    });

    const wid = workspaceId || existing.document.workspaceId;
    await createAuditLog({
      action: 'REVIEW_UPDATED',
      entityType: 'Review',
      entityId: id,
      details: { status: review.status, comment: review.comment },
      workspaceId: wid,
      userId: existing.reviewerId,
    });

    return NextResponse.json(review);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    const existing = await prisma.review.findUnique({
      where: { id },
      include: { document: { select: { workspaceId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    await prisma.review.delete({ where: { id } });

    const wid = workspaceId || existing.document.workspaceId;
    await createAuditLog({
      action: 'REVIEW_DELETED',
      entityType: 'Review',
      entityId: id,
      details: { documentId: existing.documentId, reviewerId: existing.reviewerId },
      workspaceId: wid,
      userId: existing.reviewerId,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
