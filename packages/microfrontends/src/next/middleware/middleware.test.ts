/*
 * @jest-environment @edge-runtime/jest-environment
 */

import { NextRequest } from 'next/server';
import { hashApplicationName } from '../../config/microfrontends/utils/hash-application-name';
import { MicrofrontendConfigIsomorphic } from '../../config/microfrontends-config/isomorphic';
import { getAppEnvOverrideCookieName } from '../../config/overrides';
import type { Application, Config, PathGroup } from '../../config/schema/types';
import { TEST_CONFIG } from '../../test-utils/fixtures/test-config';
import {
  getMicrofrontendsMiddleware,
  runMicrofrontendsMiddleware,
} from './middleware';

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

  describe('caching', () => {
    let testId = 0;

    function addFlaggedDocsPath() {
      // The parsed config is cached by its contents, so use a unique config
      // per test to avoid reusing one cached by an earlier test
      testId++;
      modifyRouting(config.applications.docs, {
        group: `flagged-${testId}`,
        paths: ['/docs/flagged'],
        flag: 'docsFlag',
      });
      setEnvVars();
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('reuses the parsed config across requests', async () => {
      addFlaggedDocsPath();
      const fromEnvSpy = jest.spyOn(MicrofrontendConfigIsomorphic, 'fromEnv');
      const flagValues = { docsFlag: () => Promise.resolve(true) };

      for (const path of ['/docs/flagged', '/docs/flagged', '/other']) {
        await runMicrofrontendsMiddleware({
          request: new NextRequest(`https://vercel.com${path}`, {
            headers: { cookie: 'session=abc' },
          }),
          flagValues,
        });
      }
      expect(fromEnvSpy).toHaveBeenCalledTimes(1);
    });

    it('rebuilds when the config changes', async () => {
      addFlaggedDocsPath();
      const flagValues = { docsFlag: () => Promise.resolve(true) };

      const before = await runMicrofrontendsMiddleware({
        request: new NextRequest('https://vercel.com/docs/flagged-2'),
        flagValues,
      });
      expect(before).toBeUndefined();

      modifyRouting(config.applications.docs, {
        group: 'flagged-2',
        paths: ['/docs/flagged-2'],
        flag: 'docsFlag',
      });
      setEnvVars();

      const after = await runMicrofrontendsMiddleware({
        request: new NextRequest('https://vercel.com/docs/flagged-2'),
        flagValues,
      });
      expect(
        after?.headers.get('x-middleware-request-x-vercel-mfe-zone'),
      ).toEqual('docs');
    });

    it('reuses the parsed config when override cookies change', async () => {
      addFlaggedDocsPath();
      const fromEnvSpy = jest.spyOn(MicrofrontendConfigIsomorphic, 'fromEnv');
      const flagValues = { docsFlag: () => Promise.resolve(true) };
      const overrideCookie = getAppEnvOverrideCookieName('docs');

      for (const cookie of [
        'session=abc',
        `${overrideCookie}=docs-preview.vercel.app`,
        `${overrideCookie}=docs-other.vercel.app`,
      ]) {
        const response = await runMicrofrontendsMiddleware({
          request: new NextRequest('https://vercel.com/docs/flagged', {
            headers: { cookie },
          }),
          flagValues,
        });
        expect(
          response?.headers.get('x-middleware-request-x-vercel-mfe-zone'),
        ).toEqual('docs');
      }
      expect(fromEnvSpy).toHaveBeenCalledTimes(1);
    });

    it('reuses the parsed config for new flag values objects', async () => {
      addFlaggedDocsPath();
      const fromEnvSpy = jest.spyOn(MicrofrontendConfigIsomorphic, 'fromEnv');
      const enabledFlag = jest.fn(() => Promise.resolve(true));
      const disabledFlag = jest.fn(() => Promise.resolve(false));

      // Flag values are commonly created inside the middleware function
      const enabled = await runMicrofrontendsMiddleware({
        request: new NextRequest('https://vercel.com/docs/flagged'),
        flagValues: { docsFlag: enabledFlag },
      });
      const disabled = await runMicrofrontendsMiddleware({
        request: new NextRequest('https://vercel.com/docs/flagged'),
        flagValues: { docsFlag: disabledFlag },
      });
      await expect(
        runMicrofrontendsMiddleware({
          request: new NextRequest('https://vercel.com/docs/flagged'),
          flagValues: {},
        }),
      ).rejects.toThrow('Flag "docsFlag" was specified');

      expect(enabled).toBeDefined();
      expect(disabled).toBeUndefined();
      expect(enabledFlag).toHaveBeenCalledTimes(1);
      expect(disabledFlag).toHaveBeenCalledTimes(1);
      expect(fromEnvSpy).toHaveBeenCalledTimes(1);
    });

    it('returns middlewares that callers can modify', async () => {
      addFlaggedDocsPath();
      const flagValues = { docsFlag: () => Promise.resolve(true) };
      const request = new NextRequest('https://vercel.com/docs/flagged');

      const middlewares = getMicrofrontendsMiddleware({ request, flagValues });
      const flagged = middlewares.find((m) => typeof m.src !== 'string');
      if (!flagged || typeof flagged.src === 'string') {
        throw new Error('Expected a flagged middleware');
      }
      flagged.fn = () => Promise.resolve(undefined);
      middlewares.length = 0;

      const response = await runMicrofrontendsMiddleware({
        request,
        flagValues,
      });
      expect(
        response?.headers.get('x-middleware-request-x-vercel-mfe-zone'),
      ).toEqual('docs');

      const again = getMicrofrontendsMiddleware({ request, flagValues });
      const flaggedAgain = again.find((m) => typeof m.src !== 'string');
      expect(flaggedAgain).not.toBe(flagged);
      expect(flaggedAgain?.src).not.toBe(flagged.src);
      expect(flaggedAgain?.src).toEqual(flagged.src);
    });
  });
});
