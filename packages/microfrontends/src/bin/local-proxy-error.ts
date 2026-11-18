import type { IncomingMessage } from 'node:http';
import { GEIST_SANS_400, GEIST_SANS_500 } from './geist-font';

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
 * Only browsers navigating to a page get HTML. Scripts, assets, and API
 * requests keep the plain text error.
 */
export function acceptsHtml(req: Pick<IncomingMessage, 'headers'>): boolean {
  return req.headers.accept?.includes('text/html') ?? false;
}

/**
 * Page shown when the local proxy can't connect to a locally running
 * application, for example because it is still starting or isn't running.
 *
 * Geist is embedded in the page. Colors come from the Vercel brand
 * stylesheet, with built-in fallbacks below for when it can't be loaded,
 * such as when offline.
 */
export function localProxyErrorHtml({
  app,
  port,
}: {
  app: string;
  port?: number;
}): string {
  const appName = escapeHtml(app);
  const target =
    port === undefined
      ? `<strong>${appName}</strong>`
      : `<strong>${appName}</strong> on port <strong>${port}</strong>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>Can't reach ${appName}</title>
    <link rel="stylesheet" href="https://vercel.com/geist/vercel-brand.css">
    <style>
      @font-face {
        font-family: "Geist";
        src: url("${GEIST_SANS_400}") format("woff2");
        font-weight: 400;
        font-display: swap;
      }

      @font-face {
        font-family: "Geist";
        src: url("${GEIST_SANS_500}") format("woff2");
        font-weight: 500;
        font-display: swap;
      }

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

      strong {
        font-weight: 500;
        color: var(--vbg-gray-1000, light-dark(#171717, #ededed));
      }
    </style>
  </head>
  <body class="vbg-report">
    <main>
      <div class="icon">${MICROFRONTENDS_ICON}</div>
      <p>Microfrontends can't reach ${target}<br>The application may still be starting up</p>
    </main>
  </body>
</html>`;
}
