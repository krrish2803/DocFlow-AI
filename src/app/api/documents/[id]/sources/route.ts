import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const doc = await prisma.generatedDocument.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const sources = await prisma.docSourceLink.findMany({
      where: { documentId: id },
      include: {
        sourceFile: { select: { id: true, path: true, sha: true, syncAt: true } },
        source: { select: { id: true, label: true, sourceType: true } },
      },
      orderBy: { lastCheckedAt: 'desc' },
    });

    return NextResponse.json(sources);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
