import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token');
  const pathname = request.nextUrl.pathname;
  const isRoot = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isQuizPage = pathname.startsWith('/quiz/');
  const isFlashPage = pathname.startsWith('/flash/');
  const isHomePage = pathname === '/home';
  const isCoursePage = pathname.startsWith('/course/');
  // Root and /home are the public landing; /login is admin-only (reached only by typing /login or from protected route)
  const isPublicPage = isRoot || isLoginPage || isQuizPage || isFlashPage || isHomePage || isCoursePage;

  // Allow public quiz and flash deck pages (no admin login required)
  if (isQuizPage || isFlashPage) {
    return NextResponse.next();
  }

  // If user is on login page and has token, redirect to dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not on public page and has no token, redirect to login
  if (!isPublicPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
