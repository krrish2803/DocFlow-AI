import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('docflow-token')?.value;

  const isPublic =
    pathname === '/' ||
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname.includes('.');

  if (!isPublic && !token) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (!isPublic && token) {
    const userId = await verifyToken(token);
    if (!userId) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/' && token) {
    const valid = await verifyToken(token);
    if (valid) {
      return NextResponse.redirect(new URL('/app/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
