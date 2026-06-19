import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('docflow-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      workspace: membership ? { id: membership.workspace.id, name: membership.workspace.name, slug: membership.workspace.slug } : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
