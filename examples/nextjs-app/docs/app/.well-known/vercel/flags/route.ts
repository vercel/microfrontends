import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccess, type ApiData } from 'flags';

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get('Authorization'));
  if (!access) return NextResponse.json(null, { status: 401 });

  return NextResponse.json<ApiData>({
    definitions: {
      newChildFeature: {
        description: 'Feature flag from the child app',
        options: [
          { value: false, label: 'Off' },
          { value: true, label: 'On' },
        ],
      },
    },
  });
}
