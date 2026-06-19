import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    if (!q.trim()) return NextResponse.json({ documents: [], files: [] });

    const query = q.trim();

    const documents = await prisma.generatedDocument.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      select: { id: true, title: true, status: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const sourceIds = (
      await prisma.sourceConnection.findMany({
        where: { workspaceId },
        select: { id: true },
      })
    ).map((s) => s.id);

    const files = await prisma.repoFile.findMany({
      where: {
        sourceId: { in: sourceIds },
        OR: [
          { path: { contains: query } },
          { content: { contains: query } },
        ],
      },
      select: { id: true, path: true, sourceId: true },
      orderBy: { id: 'asc' },
      take: 10,
    });

    return NextResponse.json({ documents, files });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
