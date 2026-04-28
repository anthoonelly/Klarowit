import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionJWT } from '@/lib/auth';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/workspace',
  '/projects',
  '/account',
  '/admin',
];

// Routes that require admin role
const ADMIN_PREFIXES = ['/admin'];

// Routes that should redirect to /workspace if already logged in
const AUTH_PAGES = ['/signin', '/signup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionJWT(token) : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Redirect to signin if visiting protected route without session
  if (isProtected && !payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to home if visiting admin without admin role
  if (isAdmin && payload?.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/workspace';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/workspace';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - /api/* (API routes do their own auth via session.ts)
     *  - /_next/* (Next.js internals)
     *  - Static assets and icons
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml).*)',
  ],
};
