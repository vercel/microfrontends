import type { NextRequest } from 'next/server';

export type MicrofrontendsMiddlewareHandler = (
  request: NextRequest,
) => Promise<Response | undefined>;

export interface MicrofrontendsMiddleware {
  src: string | RegExp;
  fn: MicrofrontendsMiddlewareHandler;
}
