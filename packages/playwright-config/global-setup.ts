import { writeFileSync } from 'node:fs';
import type { FullConfig } from '@playwright/test';
import { bypassStorageStatePath } from './bypass-state';

type SameSite = 'Lax' | 'None' | 'Strict';

export default async function globalSetup(config: FullConfig): Promise<void> {
  const bypass = process.env.DEPLOYMENT_PROTECTION_BYPASS;
  if (!bypass) return;

  const baseURL = config.projects.find((project) => project.use.baseURL)?.use
    .baseURL;
  if (!baseURL) {
    throw new Error('BASE_URL is not set');
  }

  const response = await fetch(baseURL, {
    headers: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
    redirect: 'manual',
  });
  const hostname = new URL(baseURL).hostname;
  const cookies = response.headers.getSetCookie().flatMap((header) => {
    const cookie = parseSetCookie(header, hostname);
    return cookie ? [cookie] : [];
  });

  writeFileSync(
    bypassStorageStatePath(baseURL),
    JSON.stringify({ cookies, origins: [] }),
  );
}

function parseSetCookie(header: string, hostname: string) {
  const [pair, ...attributes] = header.split(';').map((part) => part.trim());
  const separator = pair?.indexOf('=') ?? -1;
  if (!pair || separator <= 0) return null;

  let path = '/';
  let maxAge: number | undefined;
  let expiresAt: number | undefined;
  let httpOnly = false;
  let secure = false;
  let sameSite: SameSite = 'Lax';

  for (const attribute of attributes) {
    const [rawKey, rawValue] = attribute.split('=');
    const key = rawKey?.toLowerCase();
    const value = rawValue?.trim();
    if (key === 'path' && value) path = value;
    else if (key === 'max-age' && value) maxAge = Number(value);
    else if (key === 'expires' && value) expiresAt = Date.parse(value) / 1000;
    else if (key === 'httponly') httpOnly = true;
    else if (key === 'secure') secure = true;
    else if (key === 'samesite' && value) {
      const normalized = value.toLowerCase();
      sameSite =
        normalized === 'none'
          ? 'None'
          : normalized === 'strict'
            ? 'Strict'
            : 'Lax';
    }
  }

  return {
    name: pair.slice(0, separator),
    value: pair.slice(separator + 1),
    domain: hostname,
    path,
    expires:
      maxAge === undefined
        ? (expiresAt ?? -1)
        : Math.floor(Date.now() / 1000) + maxAge,
    httpOnly,
    secure,
    sameSite,
  };
}
