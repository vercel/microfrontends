import { runMicrofrontendsMiddleware } from '@vercel/microfrontends/next/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest): Promise<Response> {
  const mfeResponse = await runMicrofrontendsMiddleware({
    request,
    flagValues: {
      'enable-flagged-blog-page': () => Promise.resolve(true),
    },
  });
  if (mfeResponse) {
    return mfeResponse;
  }
  return NextResponse.next();
}

// Optionally define routes or paths where this middleware should apply
export const config = {
  matcher: [
    '/.well-known/vercel/microfrontends/client-config',
    '/flagged/blog',
  ],
};
