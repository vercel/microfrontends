import waitingPageTemplate from './waiting-page.html';

export interface ApplicationInfo {
  name: string;
  port?: number;
  isLocal: boolean;
  fallback?: string;
}

/**
 * Returns the HTML for the waiting page shown when upstream apps are not yet ready.
 * Features Vercel-themed styling and auto-reload when apps become available.
 */
export const waitingPageHtml = ({
  app,
  port,
  path,
  proxyPort,
  applications,
}: {
  app: string;
  port?: number;
  path?: string;
  proxyPort: number;
  applications?: ApplicationInfo[];
}): string => {
  const displayPath = path ?? '/';
  const appList = applications ?? [];

  return waitingPageTemplate
    .replace(
      "var __MFE_APP__ = '';",
      `var __MFE_APP__ = ${JSON.stringify(app)};`,
    )
    .replace(
      'var __MFE_PORT__ = null;',
      `var __MFE_PORT__ = ${port ?? 'null'};`,
    )
    .replace(
      "var __MFE_PATH__ = '/';",
      `var __MFE_PATH__ = ${JSON.stringify(displayPath)};`,
    )
    .replace(
      'var __MFE_PROXY_PORT__ = 3000;',
      `var __MFE_PROXY_PORT__ = ${proxyPort};`,
    )
    .replace(
      'var __MFE_APPLICATIONS__ = [];',
      `var __MFE_APPLICATIONS__ = ${JSON.stringify(appList)};`,
    );
};
