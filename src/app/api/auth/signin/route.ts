import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !(await comparePassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    const token = await createToken(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      workspace: membership ? { id: membership.workspace.id, name: membership.workspace.name, slug: membership.workspace.slug } : null,
    });
    res.cookies.set('docflow-token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
