import { type ApiData, verifyAccess } from 'flags';
import { getProviderData } from 'flags/next';
import { type NextRequest, NextResponse } from 'next/server';
import * as flags from '../../../flags';

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get('Authorization'));
  if (!access) return NextResponse.json(null, { status: 401 });

  const providerData = getProviderData(flags);
  return NextResponse.json<ApiData>(providerData);
}
