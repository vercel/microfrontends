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
