import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.generationJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const sources = await prisma.jobSourceLink.findMany({
      where: { jobId: id },
      include: { source: { select: { id: true, label: true, sourceType: true } } },
    });

    return NextResponse.json(sources);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
