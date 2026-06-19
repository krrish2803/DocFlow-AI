import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const currentJob = await prisma.generationJob.findUnique({ where: { id } });
    if (!currentJob) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (!currentJob.resultDocumentId) {
      return NextResponse.json({ current: null, previous: null });
    }

    const previousJob = await prisma.generationJob.findFirst({
      where: {
        workspaceId: currentJob.workspaceId,
        type: currentJob.type,
        status: 'COMPLETED',
        resultDocumentId: { not: null },
        createdAt: { lt: currentJob.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    });

    const currentDoc = await prisma.generatedDocument.findUnique({
      where: { id: currentJob.resultDocumentId },
      select: { id: true, title: true, content: true },
    });

    let previousDoc = null;
    if (previousJob?.resultDocumentId) {
      previousDoc = await prisma.generatedDocument.findUnique({
        where: { id: previousJob.resultDocumentId },
        select: { id: true, title: true, content: true },
      });
    }

    return NextResponse.json({ current: currentDoc, previous: previousDoc });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
