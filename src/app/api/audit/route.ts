import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limitParam = req.nextUrl.searchParams.get('limit');

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 100, 500) : 100;

    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
