import { getAppEnvOverrideCookieName, parseOverrides } from '.';

describe('parseOverrides', () => {
  it('parses overrides correctly', () => {
    const overrides = parseOverrides([
      {
        name: getAppEnvOverrideCookieName('vercel-site'),
        value: 'example.com',
      },
      {
        name: getAppEnvOverrideCookieName('vercel-marketing'),
        value: 'example-marketing.com',
      },
    ]);
    expect(overrides).toEqual({
      applications: {
        'vercel-site': { environment: { host: 'example.com' } },
        'vercel-marketing': {
          environment: {
            host: 'example-marketing.com',
          },
        },
      },
    });

    expect(overrides.applications['vercel-site']?.environment?.host).toEqual(
      'example.com',
    );
    expect(
      overrides.applications['vercel-marketing']?.environment?.host,
    ).toEqual('example-marketing.com');
  });

  it('returns blank overrides when overrides are not provided', () => {
    const overrides = parseOverrides([]);
    expect(overrides).toEqual({
      applications: {},
    });
  });
});
