import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const members = await prisma.membership.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(members.map((m) => ({
      id: m.id, role: m.role, userId: m.user.id, email: m.user.email, name: m.user.name,
    })));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, email } = await req.json();
    if (!workspaceId || !email) {
      return NextResponse.json({ error: 'workspaceId and email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'No user found with that email' }, { status: 404 });
    }

    const existing = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    const membership = await prisma.membership.create({
      data: { userId: user.id, workspaceId, role: 'MEMBER' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return NextResponse.json({
      id: membership.id, role: membership.role,
      userId: membership.user.id, email: membership.user.email, name: membership.user.name,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const membershipId = req.nextUrl.searchParams.get('membershipId');
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!membershipId || !workspaceId) {
      return NextResponse.json({ error: 'membershipId and workspaceId required' }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });

    const ownerCount = await prisma.membership.count({ where: { workspaceId, role: 'OWNER' } });
    if (membership.role === 'OWNER' && ownerCount <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 });
    }

    await prisma.membership.delete({ where: { id: membershipId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
