import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function generateApiKey(): { prefix: string; key: string; hashed: string } {
  const prefix = 'df_' + crypto.randomBytes(4).toString('hex');
  const raw = prefix + '_' + crypto.randomBytes(24).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { prefix, key: raw, hashed };
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, prefix: true, isRevoked: true, lastUsedAt: true, createdAt: true, expiresAt: true },
    });
    return NextResponse.json(keys);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, label, expiresInDays } = await req.json();
    if (!workspaceId || !label) {
      return NextResponse.json({ error: 'workspaceId and label required' }, { status: 400 });
    }

    const { prefix, key, hashed } = generateApiKey();
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

    await prisma.apiKey.create({
      data: { label, key: hashed, prefix, workspaceId, expiresAt },
    });

    return NextResponse.json({ prefix, key, label, expiresAt }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.apiKey.update({ where: { id }, data: { isRevoked: true } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
