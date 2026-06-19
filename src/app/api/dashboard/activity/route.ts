import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const [recentDocs, recentSyncs, recentJobs] = await Promise.all([
      prisma.generatedDocument.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, updatedAt: true, docType: true },
      }),
      prisma.sourceConnection.findMany({
        where: { workspaceId, lastSyncAt: { not: null } },
        orderBy: { lastSyncAt: 'desc' },
        take: 5,
        select: { id: true, label: true, lastSyncAt: true },
      }),
      prisma.generationJob.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, status: true, createdAt: true, resultDocumentId: true },
      }),
    ]);

    const activities: {
      id: string; type: string; label: string; status: string; link: string; timestamp: string;
    }[] = [];

    for (const doc of recentDocs) {
      activities.push({
        id: `doc-${doc.id}`, type: 'document', label: doc.title,
        status: doc.status, link: `/app/documents/${doc.id}`, timestamp: doc.updatedAt.toISOString(),
      });
    }

    for (const sync of recentSyncs) {
      activities.push({
        id: `sync-${sync.id}`, type: 'sync', label: sync.label,
        status: 'synced', link: '/app/sources', timestamp: sync.lastSyncAt!.toISOString(),
      });
    }

    for (const job of recentJobs) {
      activities.push({
        id: `job-${job.id}`, type: 'generation', label: `${job.type.replace(/-/g, ' ')} generation`,
        status: job.status, link: job.resultDocumentId ? `/app/documents/${job.resultDocumentId}` : '/app/generate',
        timestamp: job.createdAt.toISOString(),
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(activities.slice(0, 10));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
