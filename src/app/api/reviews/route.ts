import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const documentId = req.nextUrl.searchParams.get('documentId');
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (documentId) {
      const reviews = await prisma.review.findMany({
        where: { documentId },
        include: { reviewer: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(reviews);
    }

    if (workspaceId) {
      const docs = await prisma.generatedDocument.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      const docIds = docs.map((d) => d.id);
      const reviews = await prisma.review.findMany({
        where: { documentId: { in: docIds } },
        include: { reviewer: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(reviews);
    }

    return NextResponse.json({ error: 'documentId or workspaceId required' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, reviewerId, status, comment, sectionIdx, sectionLabel, workspaceId } = body;

    if (!documentId || !reviewerId || !status) {
      return NextResponse.json({ error: 'documentId, reviewerId, and status required' }, { status: 400 });
    }

    const doc = await prisma.generatedDocument.findUnique({ where: { id: documentId } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const review = await prisma.review.create({
      data: {
        documentId,
        reviewerId,
        status,
        comment: comment ?? null,
        sectionIdx: sectionIdx ?? null,
        sectionLabel: sectionLabel ?? null,
      },
      include: { reviewer: { select: { id: true, email: true, name: true } } },
    });

    const wid = workspaceId || doc.workspaceId;
    await createAuditLog({
      action: 'REVIEW_CREATED',
      entityType: 'Review',
      entityId: review.id,
      details: { documentId, reviewerId, status, sectionIdx, sectionLabel },
      workspaceId: wid,
      userId: reviewerId,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
