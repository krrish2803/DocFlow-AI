import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const [totalDocs, staleCount, reviewCount, publishedCount, sources, jobs] = await Promise.all([
      prisma.generatedDocument.count({ where: { workspaceId } }),
      prisma.generatedDocument.count({ where: { workspaceId, status: 'STALE' } }),
      prisma.generatedDocument.count({ where: { workspaceId, status: 'IN_REVIEW' } }),
      prisma.generatedDocument.count({ where: { workspaceId, isPublished: true } }),
      prisma.sourceConnection.count({ where: { workspaceId } }),
      prisma.generationJob.count({ where: { workspaceId, status: { notIn: ['COMPLETED', 'FAILED'] } } }),
    ]);

    return NextResponse.json({
      healthScore: Math.round(((totalDocs - staleCount) / Math.max(totalDocs, 1)) * 100),
      totalDocs,
      stalePages: staleCount,
      pendingReviews: reviewCount,
      unansweredQuestions: 0,
      publishedPages: publishedCount,
      recentSyncs: sources,
      pendingJobs: jobs,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
