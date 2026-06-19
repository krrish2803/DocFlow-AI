import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await params;

    const source = await prisma.sourceConnection.findUnique({
      where: { id: sourceId },
      include: {
        files: {
          select: { path: true, sha: true, syncAt: true },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json({
      source: {
        id: source.id,
        label: source.label,
        sourceType: source.sourceType,
        repositoryUrl: source.repositoryUrl,
        status: source.status,
        lastSyncAt: source.lastSyncAt,
      },
      fileCount: source.files.length,
      files: source.files,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
