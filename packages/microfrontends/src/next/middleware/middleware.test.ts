/*
 * @jest-environment @edge-runtime/jest-environment
 */

import { NextRequest } from 'next/server';
import type { Config, Application, PathGroup } from '../../config/schema/types';
import { TEST_CONFIG } from '../../test-utils/fixtures/test-config';
import { MicrofrontendConfigIsomorphic } from '../../config/microfrontends-config/isomorphic';
import { hashApplicationName } from '../../config/microfrontends-config/isomorphic/utils/hash-application-name';
import { runMicrofrontendsMiddleware } from './middleware';

const OLD_ENV = process.env;

type Fetch = typeof fetch;

function modifyRouting(
  application: Application | undefined,
  group: PathGroup,
): void {
  if (application && 'routing' in application) {
    application.routing.push(group);
  }
}

describe('runMicrofrontendsMiddleware', () => {
  let config: Config;
  let originalFetch: Fetch;
  const fetchMock = jest.fn<ReturnType<Fetch>, Parameters<Fetch>>(() => {
    // eslint-disable-next-line no-console
    console.error('fetchMock not implemented');
    throw new Error('No implementation provided');
  });

  function setEnvVars() {
    process.env.MFE_CONFIG = JSON.stringify(config);
  }

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION = 'dashboard';
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH =
      hashApplicationName('dashboard');
    config = JSON.parse(JSON.stringify(TEST_CONFIG)) as Config;
    setEnvVars();

    originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    fetchMock.mockClear();
  });

  it('flagged paths are routed to the correct zone', async () => {
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/docs/flagged'),
      flagValues: { docsFlag: () => Promise.resolve(true) },
    });
    expect(response).toBeDefined();
    expect(response?.headers.get('x-vercel-mfe-zone')).toBeNull();
    expect(
      response?.headers.get('x-middleware-request-x-vercel-mfe-zone'),
    ).toEqual('docs');
  });

  it('missing flag function throws an error', async () => {
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    await expect(
      runMicrofrontendsMiddleware({
        request: new NextRequest('https://vercel.com/docs/flagged'),
        flagValues: {},
      }),
    ).rejects.toThrow(
      'Flag "docsFlag" was specified to control routing for path group "flagged" in application docs but not found in provided flag values.',
    );
  });

  it('flagged path is not routed when flag returns false', async () => {
    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/docs/flagged'),
      flagValues: { docsFlag: () => Promise.resolve(false) },
    });
    expect(response).toBeUndefined();
  });

  it('does not rewrite paths for child zone', async () => {
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION = 'docs';
    process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH =
      hashApplicationName('docs');
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/docs/flagged'),
      flagValues: { docsFlag: () => Promise.resolve(true) },
    });
    expect(response).toBeUndefined();
  });

  it('rewrites requests to local proxy if running', async () => {
    process.env.TURBO_TASK_HAS_MFE_PROXY = 'true';
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('http://localhost:3000/docs/flagged'),
      flagValues: { docsFlag: () => Promise.resolve(true) },
    });
    expect(response).toBeDefined();
    expect(response?.headers.get('x-middleware-rewrite')).toEqual(
      'http://localhost:3024/docs/flagged',
    );
    expect(
      response?.headers.get('x-middleware-request-x-vercel-mfe-zone'),
    ).toEqual('docs');
  });

  it('does not rewrites to local proxy if disabled', async () => {
    process.env.TURBO_TASK_HAS_MFE_PROXY = 'true';
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('http://localhost:3000/docs/flagged'),
      flagValues: { docsFlag: () => Promise.resolve(false) },
    });
    expect(response).toBeUndefined();
  });

  it('does not use flag value if the local proxy is not running', async () => {
    process.env.TURBO_TASK_HAS_MFE_PROXY = undefined;
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const mockDocsFlag = jest.fn(() => Promise.resolve(false));
    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/docs/flagged', {
        headers: { 'x-vercel-mfe-flag-value': 'true' },
      }),
      flagValues: { docsFlag: mockDocsFlag },
    });
    expect(mockDocsFlag).toHaveBeenCalledTimes(1);
    expect(response).toBeUndefined();
  });

  it('does not execute flag if flag value header present', async () => {
    process.env.TURBO_TASK_HAS_MFE_PROXY = 'true';
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const mockDocsFlag = jest.fn(() => Promise.resolve(true));
    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/docs/flagged', {
        headers: { 'x-vercel-mfe-flag-value': 'false' },
      }),
      flagValues: { docsFlag: mockDocsFlag },
    });
    expect(mockDocsFlag).toHaveBeenCalledTimes(0);
    expect(response).toBeUndefined();
  });

  it('does rewrites if flag value header true', async () => {
    process.env.TURBO_TASK_HAS_MFE_PROXY = 'true';
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const mockDocsFlag = jest.fn(() => Promise.resolve(true));
    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/docs/flagged', {
        headers: { 'x-vercel-mfe-flag-value': 'true' },
      }),
      flagValues: { docsFlag: mockDocsFlag },
    });
    expect(mockDocsFlag).toHaveBeenCalledTimes(0);
    expect(response).toBeDefined();
    expect(response?.headers.get('x-vercel-mfe-zone')).toBeNull();
    expect(
      response?.headers.get('x-middleware-request-x-vercel-mfe-zone'),
    ).toEqual('docs');
  });

  it('does not rewrites if flag value header true and mismatched path', async () => {
    process.env.TURBO_TASK_HAS_MFE_PROXY = 'true';
    modifyRouting(config.applications.docs, {
      group: 'flagged',
      paths: ['/docs/flagged'],
      flag: 'docsFlag',
    });
    setEnvVars();

    const mockDocsFlag = jest.fn(() => Promise.resolve(true));
    const response = await runMicrofrontendsMiddleware({
      request: new NextRequest('https://vercel.com/bad-path', {
        headers: { 'x-vercel-mfe-flag-value': 'true' },
      }),
      flagValues: { docsFlag: mockDocsFlag },
    });
    expect(mockDocsFlag).toHaveBeenCalledTimes(0);
    expect(response).toBeUndefined();
  });

  describe('.well-known/vercel/microfrontends/client-config route', () => {
    it('automatically handles .well-known/vercel/microfrontends/client-config route', async () => {
      modifyRouting(config.applications.docs, {
        group: 'flagged',
        paths: ['/docs/flagged'],
        flag: 'docsFlag',
      });
      setEnvVars();

      const mockDocsFlag = jest.fn(() => Promise.resolve(true));
      const response = await runMicrofrontendsMiddleware({
        request: new NextRequest(
          'https://vercel.com/.well-known/vercel/microfrontends/client-config',
        ),
        flagValues: { docsFlag: mockDocsFlag },
      });
      expect(mockDocsFlag).toHaveBeenCalledTimes(1);

      const expectedConfig = new MicrofrontendConfigIsomorphic({ config })
        .toClientConfig()
        .serialize();
      // @ts-expect-error - this will be defined.
      expectedConfig.applications.e3e2a9.routing = [
        { paths: ['/docs/flagged'] },
      ];

      expect(await response?.json()).toEqual({
        config: expectedConfig,
      });
    });

    it('removes flagged paths with value of false', async () => {
      modifyRouting(config.applications.docs, {
        group: 'flagged',
        paths: ['/docs/flagged'],
        flag: 'docsFlag',
      });
      setEnvVars();

      const mockDocsFlag = jest.fn(() => Promise.resolve(false));
      const response = await runMicrofrontendsMiddleware({
        request: new NextRequest(
          'https://vercel.com/.well-known/vercel/microfrontends/client-config',
        ),
        flagValues: { docsFlag: mockDocsFlag },
      });
      expect(mockDocsFlag).toHaveBeenCalledTimes(1);

      const expectedConfig = new MicrofrontendConfigIsomorphic({ config })
        .toClientConfig({ removeFlaggedPaths: true })
        .serialize();

      expect(await response?.json()).toEqual({
        config: expectedConfig,
      });
    });
  });
});
