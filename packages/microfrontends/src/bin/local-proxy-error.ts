import type { IncomingMessage } from 'node:http';
import { GEIST_EXTENDED_CHARACTERS, GEIST_SANS } from './geist-font';

/**
 * Geist "microfrontends" icon (14x14), drawn with `currentColor`.
 */
const MICROFRONTENDS_ICON = `<svg width="17" height="17" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 5C2.59736 5 2.92634 4.92129 3.22006 4.78073L7.00001 8.56067L10.7799 4.78073C11.0737 4.92129 11.4027 5 11.75 5C12.9927 5 14 3.99264 14 2.75C14 1.50736 12.9927 0.5 11.75 0.5C10.5074 0.5 9.50001 1.50736 9.50001 2.75C9.50001 3.09736 9.57872 3.42634 9.71929 3.72006L7.00001 6.43934L4.28073 3.72006C4.42129 3.42634 4.5 3.09736 4.5 2.75C4.5 1.50736 3.49264 0.5 2.25 0.5C1.00736 0.5 0 1.50736 0 2.75C0 3.99264 1.00736 5 2.25 5ZM3 2.75C3 3.16422 2.66422 3.5 2.25 3.5C1.83579 3.5 1.5 3.16422 1.5 2.75C1.5 2.33579 1.83579 2 2.25 2C2.66422 2 3 2.33579 3 2.75ZM11.75 3.5C12.1642 3.5 12.5 3.16422 12.5 2.75C12.5 2.33579 12.1642 2 11.75 2C11.3358 2 11 2.33579 11 2.75C11 3.16422 11.3358 3.5 11.75 3.5Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 13.5C3.49264 13.5 4.5 12.4927 4.5 11.25C4.5 10.2703 3.8739 9.43691 3 9.12804V6.5H1.5V9.12804C0.626106 9.43691 0 10.2703 0 11.25C0 12.4927 1.00736 13.5 2.25 13.5ZM3 11.25C3 11.6642 2.66422 12 2.25 12C1.83579 12 1.5 11.6642 1.5 11.25C1.5 10.8358 1.83579 10.5 2.25 10.5C2.66422 10.5 3 10.8358 3 11.25Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.75 13.5C12.9927 13.5 14 12.4927 14 11.25C14 10.2703 13.3739 9.43691 12.5 9.12804V6.5H11V9.12804C10.1261 9.43691 9.50001 10.2703 9.50001 11.25C9.50001 12.4927 10.5074 13.5 11.75 13.5ZM12.5 11.25C12.5 11.6642 12.1642 12 11.75 12C11.3358 12 11 11.6642 11 11.25C11 10.8358 11.3358 10.5 11.75 10.5C12.1642 10.5 12.5 10.8358 12.5 11.25Z" fill="currentColor"/>
</svg>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Embeds the small core Geist file for a weight, or the full one (core plus
 * Latin-1, Latin Extended-A, Greek, and Cyrillic) when that weight's text
 * needs it. One file per weight keeps kerning between accented and plain
 * letters.
 */
function geistFontFace(weight: 400 | 500, text: string): string {
  const file = GEIST_EXTENDED_CHARACTERS.test(text)
    ? GEIST_SANS[weight].full
    : GEIST_SANS[weight].core;
  return `@font-face {
        font-family: "Geist";
        src: url("${file.src}") format("woff2");
        font-weight: ${weight};
        font-display: swap;
        unicode-range: ${file.unicodeRange};
      }`;
}

/**
 * Only browsers navigating to a page get HTML. Scripts, assets, and API
 * requests keep the plain text error.
 */
export function acceptsHtml(req: Pick<IncomingMessage, 'headers'>): boolean {
  return req.headers.accept?.includes('text/html') ?? false;
}

/**
 * Page shown when the local proxy can't connect to an application: usually a
 * locally running one that is still starting or isn't running, or (rarely)
 * an http:// fallback.
 *
 * Geist is embedded in the page. Colors come from the Vercel brand
 * stylesheet, with built-in fallbacks below for when it can't be loaded,
 * such as when offline.
 */
export function localProxyErrorHtml({
  app,
  isLocal,
  hostname,
  port,
}: {
  app: string | undefined;
  /** false for a fallback, which can't be "starting up". */
  isLocal: boolean;
  hostname: string;
  port?: number;
}): string {
  const appName = app?.trim() ? escapeHtml(app) : undefined;
  const named = appName ? `<strong>${appName}</strong>` : 'the application';

  let target: string;
  let hint: string;
  if (isLocal) {
    target =
      port === undefined ? named : `${named} on port <strong>${port}</strong>`;
    hint = 'The application may still be starting up.';
  } else {
    const address = escapeHtml(
      port === undefined ? hostname : `${hostname}:${port}`,
    );
    target = appName
      ? `the fallback for ${named} at <strong>${address}</strong>`
      : `the fallback at <strong>${address}</strong>`;
    hint = 'Check that the application is running and reachable.';
  }
  const title = appName
    ? `Can't reach ${appName}`
    : "Can't reach the application";
  const message = `<p>Microfrontends can't reach ${target}.</p>
        <p>${hint}</p>`;
  // <strong> renders in 500, everything else in 400.
  const strong = /<strong>(.*?)<\/strong>/g;
  const mediumText = [...message.matchAll(strong)]
    .map((match) => match[1])
    .join('');
  const regularText = message.replace(strong, '');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>${title}</title>
    <link rel="stylesheet" href="https://vercel.com/geist/vercel-brand.css">
    <style>
      ${geistFontFace(400, regularText)}

      ${geistFontFace(500, mediumText)}

      html {
        color-scheme: light dark;
      }

      body {
        margin: 0;
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--vbg-background-100, light-dark(#fff, #000));
        font-family: var(--vbg-font-sans, "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        -webkit-font-smoothing: antialiased;
      }

      main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px;
        /* Let long lines wrap instead of growing past the viewport. */
        max-width: 100%;
        /* Sit slightly above the vertical center. */
        margin-bottom: 8vh;
        text-align: center;
      }

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--vbg-gray-200, light-dark(#ebebeb, #1f1f1f));
        box-shadow: 0 0 0 1px var(--vbg-gray-alpha-500, light-dark(rgba(0, 0, 0, 0.21), rgba(255, 255, 255, 0.24)));
        color: var(--vbg-gray-1000, light-dark(#171717, #ededed));
      }

      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.45;
        color: var(--vbg-gray-900, light-dark(#666, #a1a1a1));
        text-wrap: balance;
      }

      p + p {
        margin-top: 12px;
      }

      strong {
        font-weight: 500;
        color: var(--vbg-gray-1000, light-dark(#171717, #ededed));
      }
    </style>
  </head>
  <body class="vbg-report">
    <main>
      <div class="icon">${MICROFRONTENDS_ICON}</div>
      <div>
        ${message}
      </div>
    </main>
  </body>
</html>`;
}
