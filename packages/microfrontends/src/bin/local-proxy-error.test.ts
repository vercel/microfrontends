import { acceptsHtml, localProxyErrorHtml } from './local-proxy-error';

describe('localProxyErrorHtml', () => {
  it('names the application and port', () => {
    const html = localProxyErrorHtml({ app: 'vercel-site', port: 3024 });
    expect(html).toContain(
      "Microfrontends can't reach <strong>vercel-site</strong> on port <strong>3024</strong>",
    );
    expect(html).toContain('The application may still be starting up');
    expect(html).toContain("<title>Can't reach vercel-site</title>");
  });

  it('leaves out the port when there is none', () => {
    const html = localProxyErrorHtml({ app: 'docs' });
    expect(html).toContain(
      "Microfrontends can't reach <strong>docs</strong><br>",
    );
    expect(html).not.toContain('on port');
  });

  it('escapes the application name', () => {
    const html = localProxyErrorHtml({ app: '<img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
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
