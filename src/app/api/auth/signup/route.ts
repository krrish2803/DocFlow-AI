import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth-server';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, workspaceName } = await req.json();

    const nameErr = validateName(name);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });
    const emailErr = validateEmail(email);
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });
    const passErr = validatePassword(password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const slug = (workspaceName || `${name}'s Workspace`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `workspace-${Date.now()}`;

    const hashed = await hashPassword(password);

    const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const user = await prisma.user.create({
      data: { email, name, password: hashed },
    });

    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: workspaceName || `${name}'s Workspace`,
          slug: finalSlug,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });

      const token = await createToken(user.id);
      const res = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name },
        workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      });
      res.cookies.set('docflow-token', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    } catch {
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json({ error: 'Failed to create workspace. Please try again.' }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
