import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const session = await auth();
  const pathname = request.nextUrl.pathname;

  // 1. Generate Request ID for tracing
  const requestId = crypto.randomUUID();
  const correlationId = request.headers.get('x-correlation-id') || requestId;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-correlation-id', correlationId);

  // 2. Extract Tenant from Subdomain
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  const isMainDomain = !subdomain || subdomain === 'www' || subdomain === 'examsphere' || subdomain === 'localhost';
  
  if (!isMainDomain) {
    requestHeaders.set('x-tenant-subdomain', subdomain);
  }

  // 3. Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/v1/auth');
  const isAiRoute = pathname.startsWith('/api/v1/ai') || pathname.includes('ai-tutor') || pathname.includes('ai-planner');
  
  let rateLimitKey = ip;
  let rateLimit = 100; // Default: 100 req/min
  let rateWindow = 60000; // 1 minute
  
  if (isAuthRoute) {
    rateLimit = 10; // 10 req/min for auth
  } else if (isAiRoute) {
    rateLimit = 20; // 20 req/min for AI
  }
  
  if (session?.user?.id) {
    rateLimitKey = `user:${session.user.id}`;
    rateLimit = isAiRoute ? 30 : 200; // Higher limits for authenticated users
  }
  
  if (!checkRateLimit(rateLimitKey, rateLimit, rateWindow)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'x-request-id': requestId,
        },
      }
    );
  }

  // 4. Authentication Check
  const isProtectedRoute = pathname.startsWith('/student') || 
                           pathname.startsWith('/teacher') || 
                           pathname.startsWith('/institute') || 
                           pathname.startsWith('/super-admin');

  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && session) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // 5. CSRF Protection for mutations
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && !origin.includes(host) && process.env.NODE_ENV === 'production') {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF Token Invalid' }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  }

  // 6. Security Headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';"
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
