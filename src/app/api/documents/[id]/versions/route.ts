import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: 'desc' },
      take: 50,
    });
    return NextResponse.json(versions);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
