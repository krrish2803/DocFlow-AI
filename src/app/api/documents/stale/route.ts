import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const docs = await prisma.generatedDocument.findMany({
      where: { workspaceId },
      include: {
        docSources: {
          include: {
            sourceFile: true,
            source: { select: { label: true, sourceType: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const staleDocuments = [];

    for (const doc of docs) {
      const changedSources = [];

      for (const link of doc.docSources) {
        const currentFile = await prisma.repoFile.findUnique({
          where: { id: link.sourceFileId },
        });

        if (!currentFile) continue;

        const isStale = currentFile.sha !== link.fileContentHash;

        if (isStale) {
          changedSources.push({
            docSourceLinkId: link.id,
            sourceFileId: currentFile.id,
            filePath: currentFile.path,
            previousHash: link.fileContentHash,
            currentHash: currentFile.sha,
            source: link.source,
          });
        }

        await prisma.docSourceLink.update({
          where: { id: link.id },
          data: {
            stale: isStale,
            lastCheckedAt: new Date(),
          },
        });
      }

      if (changedSources.length > 0) {
        staleDocuments.push({
          documentId: doc.id,
          title: doc.title,
          slug: doc.slug,
          changedSources,
        });
      }
    }

    return NextResponse.json({ staleDocuments });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
