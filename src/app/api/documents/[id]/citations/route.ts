import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const doc = await prisma.generatedDocument.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const links = await prisma.docSourceLink.findMany({
      where: { documentId: id },
      include: {
        sourceFile: { select: { id: true, path: true, content: true, sha: true } },
        source: { select: { id: true, label: true, sourceType: true } },
      },
      orderBy: { lastCheckedAt: 'desc' },
    });

    const citations = links.map((link) => ({
      id: link.id,
      fileContentHash: link.fileContentHash,
      lastCheckedAt: link.lastCheckedAt,
      stale: link.stale,
      sourceFile: {
        id: link.sourceFile.id,
        path: link.sourceFile.path,
        content: link.sourceFile.content,
        sha: link.sourceFile.sha,
      },
      source: {
        id: link.source.id,
        label: link.source.label,
        sourceType: link.source.sourceType,
      },
    }));

    return NextResponse.json(citations);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
