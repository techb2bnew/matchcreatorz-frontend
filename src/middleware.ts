import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token    = request.cookies.get('mc_token')?.value;
  const userType = request.cookies.get('mc_user_type')?.value;

  const isLoggedIn = !!token;

  // Auth pages — already logged in hain toh dashboard pe bhejo
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (isLoggedIn) {
      if (userType === 'ADMIN')  return NextResponse.redirect(new URL('/admin/dashboard',  request.url));
      if (userType === 'SELLER') return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      if (userType === 'BUYER')  return NextResponse.redirect(new URL('/buyer/home',       request.url));
    }
    return NextResponse.next();
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', request.url));
    if (userType !== 'ADMIN') {
      if (userType === 'SELLER') return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      if (userType === 'BUYER')  return NextResponse.redirect(new URL('/buyer/home',       request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Seller routes
  if (pathname.startsWith('/seller')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', request.url));
    if (userType !== 'SELLER') {
      if (userType === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (userType === 'BUYER') return NextResponse.redirect(new URL('/buyer/home',      request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Buyer routes
  if (pathname.startsWith('/buyer')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', request.url));
    if (userType !== 'BUYER') {
      if (userType === 'ADMIN')  return NextResponse.redirect(new URL('/admin/dashboard',  request.url));
      if (userType === 'SELLER') return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
    '/buyer/:path*',
    '/login',
    '/signup',
  ],
};
