import { checkRateLimit } from '@vercel/firewall';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rateLimitResponse = await checkRateLimit('child-rate-limit');
    return NextResponse.json(rateLimitResponse);
  } catch (e) {
    return NextResponse.json({
      error: String(e),
    });
  }
}
