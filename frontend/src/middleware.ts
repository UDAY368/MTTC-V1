import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isQuizPage = request.nextUrl.pathname.startsWith('/quiz/');
  const isHomePage = request.nextUrl.pathname === '/home';
  const isCoursePage = request.nextUrl.pathname.startsWith('/course/');
  const isPublicPage = isLoginPage || isQuizPage || isHomePage || isCoursePage;

  // Allow public quiz pages
  if (isQuizPage) {
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
