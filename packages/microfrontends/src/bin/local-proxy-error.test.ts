import { GEIST_SANS } from './geist-font';
import { acceptsHtml, localProxyErrorHtml } from './local-proxy-error';

describe('localProxyErrorHtml', () => {
  const local = { isLocal: true, hostname: 'localhost' };

  it('names the local application and port', () => {
    const html = localProxyErrorHtml({
      ...local,
      app: 'vercel-site',
      port: 3024,
    });
    expect(html).toContain(
      "Microfrontends can't reach <strong>vercel-site</strong> on port <strong>3024</strong>.",
    );
    // The hint is its own paragraph, spaced from the first one.
    expect(html).toContain('<p>The application may still be starting up.</p>');
    expect(html).toContain("<title>Can't reach vercel-site</title>");
  });

  it('leaves out the port when there is none', () => {
    const html = localProxyErrorHtml({ ...local, app: 'docs' });
    expect(html).toContain("Microfrontends can't reach <strong>docs</strong>.");
    expect(html).not.toContain('on port');
  });

  it('describes a fallback by its address, without "starting up"', () => {
    const html = localProxyErrorHtml({
      app: 'docs',
      isLocal: false,
      hostname: 'staging.example.com',
      port: 8080,
    });
    expect(html).toContain(
      "Microfrontends can't reach the fallback for <strong>docs</strong> at <strong>staging.example.com:8080</strong>.",
    );
    expect(html).toContain(
      'Check that the application is running and reachable.',
    );
    expect(html).not.toContain('starting up');
  });

  it('says "the application" when there is no name', () => {
    for (const app of [undefined, '', '  ']) {
      const html = localProxyErrorHtml({ ...local, app, port: 3000 });
      expect(html).toContain(
        "Microfrontends can't reach the application on port <strong>3000</strong>.",
      );
      expect(html).toContain("<title>Can't reach the application</title>");
    }
    expect(
      localProxyErrorHtml({ app: '', isLocal: false, hostname: 'example.com' }),
    ).toContain(
      "Microfrontends can't reach the fallback at <strong>example.com</strong>.",
    );
  });

  it('embeds Geist instead of loading it from the network', () => {
    const html = localProxyErrorHtml({
      ...local,
      app: 'vercel-site',
      port: 3024,
    });
    expect(html.match(/src: url\("data:font\/woff2;base64,/g)).toHaveLength(2);
    expect(html).not.toContain('fonts.googleapis.com');
  });

  it('embeds only the core Geist files for ASCII text', () => {
    const variants = [
      { ...local, app: 'vercel-site', port: 3024 },
      { ...local, app: undefined },
      {
        app: 'docs',
        isLocal: false,
        hostname: 'staging.example.com',
        port: 8080,
      },
      { app: undefined, isLocal: false, hostname: 'example.com' },
    ];
    for (const args of variants) {
      const html = localProxyErrorHtml(args);
      // The page's own text must fit in the core files. If this fails, add
      // the new characters to CORE in scripts/subset-geist-font.ts and rerun
      // `pnpm -F @vercel/microfrontends generate:geist-font`.
      expect(html).toContain(`src: url("${GEIST_SANS[400].core.src}")`);
      expect(html).toContain(`src: url("${GEIST_SANS[500].core.src}")`);
      expect(html).not.toContain(GEIST_SANS[400].full.src);
      expect(html).not.toContain(GEIST_SANS[500].full.src);
      expect(html).toContain(
        `unicode-range: ${GEIST_SANS[400].core.unicodeRange};`,
      );
    }
  });

  it('embeds the full Geist file only for the weight that needs it', () => {
    // Application names and addresses render in <strong>, weight 500.
    const html = localProxyErrorHtml({ ...local, app: 'café', port: 3000 });
    expect(html).toContain(`src: url("${GEIST_SANS[500].full.src}")`);
    expect(html).toContain(
      `unicode-range: ${GEIST_SANS[500].full.unicodeRange};`,
    );
    expect(html).not.toContain(GEIST_SANS[500].core.src);
    expect(html).toContain(`src: url("${GEIST_SANS[400].core.src}")`);
  });

  it('embeds the full Geist file for Cyrillic and Greek names', () => {
    for (const app of ['документы', 'λambda']) {
      const html = localProxyErrorHtml({ ...local, app, port: 3000 });
      expect(html).toContain(`src: url("${GEIST_SANS[500].full.src}")`);
    }
  });

  it('leaves characters Geist subsets lack to the system fonts', () => {
    const html = localProxyErrorHtml({ ...local, app: '文档', port: 3000 });
    expect(html).toContain(`src: url("${GEIST_SANS[500].core.src}")`);
  });

  it('escapes the application name and address', () => {
    const html = localProxyErrorHtml({
      app: '<img src=x onerror=alert(1)>',
      isLocal: false,
      hostname: '<b>host</b>',
    });
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>host</b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;host&lt;/b&gt;');
  });
});

describe('acceptsHtml', () => {
  it('is true for browser navigations', () => {
    expect(
      acceptsHtml({
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      }),
    ).toBe(true);
  });

  it('is false for other requests', () => {
    expect(acceptsHtml({ headers: {} })).toBe(false);
    expect(acceptsHtml({ headers: { accept: '*/*' } })).toBe(false);
    expect(acceptsHtml({ headers: { accept: 'application/json' } })).toBe(
      false,
    );
  });
});
