import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, assigneeId, workspaceId } = body;

    if (!documentId || !assigneeId) {
      return NextResponse.json({ error: 'documentId and assigneeId required' }, { status: 400 });
    }

    const doc = await prisma.generatedDocument.findUnique({ where: { id: documentId } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const assignment = await prisma.reviewAssignment.create({
      data: { documentId, assigneeId },
      include: { assignee: { select: { id: true, email: true, name: true } } },
    });

    const wid = workspaceId || doc.workspaceId;
    await createAuditLog({
      action: 'REVIEWER_ASSIGNED',
      entityType: 'ReviewAssignment',
      entityId: assignment.id,
      details: { documentId, assigneeId },
      workspaceId: wid,
      userId: assigneeId,
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const documentId = req.nextUrl.searchParams.get('documentId');
    if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

    const assignments = await prisma.reviewAssignment.findMany({
      where: { documentId },
      include: { assignee: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
