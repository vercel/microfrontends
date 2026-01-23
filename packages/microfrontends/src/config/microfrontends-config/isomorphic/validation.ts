import { parse as parsePathRegexp, pathToRegexp } from 'path-to-regexp';
import { MicrofrontendError } from '../../errors';
import type {
  ApplicationId,
  ApplicationRouting,
  ChildApplication as ChildApplicationConfig,
  PathGroup,
} from '../../schema/types';
import { isDefaultApp } from '../../schema/utils/is-default-app';

const LIST_FORMATTER = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction',
});

const VALID_ASSET_PREFIX_REGEXP = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Validate all paths in a configuration - ensures paths do not overlap
 */
export const validateConfigPaths = (
  applicationConfigsById?: ApplicationRouting,
): void => {
  if (!applicationConfigsById) {
    return;
  }

  const pathsByApplicationId = new Map<
    PathGroup['paths'][number],
    {
      applications: ApplicationId[];
      matcher: RegExp;
      applicationId?: ApplicationId;
    }
  >();
  const errors: string[] = [];

  for (const [id, app] of Object.entries(applicationConfigsById)) {
    if (isDefaultApp(app)) {
      // default applications do not have routing
      continue;
    }

    for (const pathMatch of app.routing) {
      for (const path of pathMatch.paths) {
        const maybeError = validatePathExpression(path);
        if (maybeError) {
          errors.push(maybeError);
        } else {
          const existing = pathsByApplicationId.get(path);
          if (existing) {
            existing.applications.push(id);
          } else {
            pathsByApplicationId.set(path, {
              applications: [id],
              matcher: pathToRegexp(path),
              applicationId: id,
            });
          }
        }
      }
    }
  }
  const entries = Array.from(pathsByApplicationId.entries());

  for (const [path, { applications: ids, matcher, applicationId }] of entries) {
    if (ids.length > 1) {
      errors.push(
        `Duplicate path "${path}" for applications "${ids.join(', ')}"`,
      );
    }

    for (const [
      matchPath,
      { applications: matchIds, applicationId: matchApplicationId },
    ] of entries) {
      if (path === matchPath) {
        // we're comparing to ourselves, so skip
        continue;
      }

      if (applicationId === matchApplicationId) {
        // we're comparing to paths within our own application, which are allowed to overlap, so skip
        continue;
      }

      if (matcher.test(matchPath)) {
        const source = `"${path}" of application${ids.length > 0 ? 's' : ''} ${ids.join(', ')}`;
        const destination = `"${matchPath}" of application${matchIds.length > 0 ? 's' : ''} ${matchIds.join(', ')}`;

        errors.push(
          `Overlapping path detected between ${source} and ${destination}`,
        );
      }
    }
  }

  if (errors.length) {
    throw new MicrofrontendError(
      `Invalid paths: ${errors.join(', ')}. See supported paths in the documentation https://vercel.com/docs/microfrontends/path-routing#supported-path-expressions.`,
      {
        type: 'config',
        subtype: 'conflicting_paths',
      },
    );
  }
};

// From https://github.com/pillarjs/path-to-regexp/blob/75a92c3d7c42159f459ab42f346899152906ea8c/src/index.ts#L183-L184
const PATH_DEFAULT_PATTERNS = ['[^\\/#\\?]+?', '(?:(?!\\.)[^\\/#\\?])+?'];

function validatePathExpression(path: string): string | undefined {
  try {
    const tokens = parsePathRegexp(path);
    if (/(?<!\\)\{/.test(path)) {
      return `Optional paths are not supported: ${path}`;
    }
    if (/(?<!\\|\()\?/.test(path)) {
      return `Optional paths are not supported: ${path}`;
    }
    if (/\/[^/]*(?<!\\):[^/]*(?<!\\):[^/]*/.test(path)) {
      return `Only one wildcard is allowed per path segment: ${path}`;
    }
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === undefined) {
        return `token ${i} in ${path} is undefined, this shouldn't happen`;
      }
      if (typeof token !== 'string') {
        if (!token.name) {
          return `Only named wildcards are allowed: ${path} (hint: add ":path" to the wildcard)`;
        }
        if (
          !PATH_DEFAULT_PATTERNS.includes(token.pattern) &&
          // Allows (a|b|c) and ((?!a|b|c).*) regex
          // Only limited regex is supported for now, due to performance considerations
          // Allows all letters, numbers, and hyphens. Other characters must be escaped.
          !/^(?<allowed>[\w-~]+(?:\|[^:|()]+)+)$|^\(\?!(?<disallowed>[\w-~]+(?:\|[^:|()]+)*)\)\.\*$/.test(
            token.pattern.replace(/\\./g, ''),
          )
        ) {
          return `Path ${path} cannot use unsupported regular expression wildcard. If the path includes special characters, they must be escaped with backslash (e.g. '\\(')`;
        }
        if (token.modifier && i !== tokens.length - 1) {
          return `Modifier ${token.modifier} is not allowed on wildcard :${token.name} in ${path}. Modifiers are only allowed in the last path component`;
        }
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return `Path ${path} could not be parsed into regexp: ${message}`;
  }
  return undefined;
}

/**
 * Validate all paths in an application - ensures paths are the correct format
 */
export const validateAppPaths = (
  name: string,
  app: ChildApplicationConfig,
): void => {
  // validate routes
  for (const group of app.routing) {
    for (const p of group.paths) {
      if (p === '/') {
        continue;
      }
      if (p.endsWith('/')) {
        throw new MicrofrontendError(
          `Invalid path for application "${name}". ${p} must not end with a slash.`,
          { type: 'application', subtype: 'invalid_path' },
        );
      }

      if (!p.startsWith('/')) {
        throw new MicrofrontendError(
          `Invalid path for application "${name}". ${p} must start with a slash.`,
          { type: 'application', subtype: 'invalid_path' },
        );
      }
    }
  }
  if (app.assetPrefix) {
    if (!VALID_ASSET_PREFIX_REGEXP.test(app.assetPrefix)) {
      throw new MicrofrontendError(
        `Invalid asset prefix for application "${name}". ${app.assetPrefix} must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.`,
        { type: 'application', subtype: 'invalid_asset_prefix' },
      );
    }
    if (
      app.assetPrefix !== `vc-ap-${name}` &&
      !app.routing.some(
        (group) =>
          group.paths.includes(`/${app.assetPrefix}/:path*`) && !group.flag,
      )
    ) {
      throw new MicrofrontendError(
        `When \`assetPrefix\` is specified, \`/${app.assetPrefix}/:path*\` must be added the routing paths for the application. Changing the asset prefix is not a forwards and backwards compatible change, and the custom asset prefix should be added to \`paths\` and deployed before setting the \`assetPrefix\` field.`,
        { type: 'application', subtype: 'invalid_asset_prefix' },
      );
    }
  }
};

/**
 * Make sure only one `Application` defines routing
 * */
export const validateConfigDefaultApplication = (
  applicationConfigsById?: ApplicationRouting,
): void => {
  if (!applicationConfigsById) {
    return;
  }

  const applicationsWithoutRouting = Object.entries(
    applicationConfigsById,
  ).filter(([, app]) => isDefaultApp(app));
  const numApplicationsWithoutRouting = applicationsWithoutRouting.reduce(
    (acc) => {
      return acc + 1;
    },
    0,
  );

  if (numApplicationsWithoutRouting === 0) {
    throw new MicrofrontendError(
      'No default application found. At least one application needs to be the default by omitting routing.',
      { type: 'config', subtype: 'no_default_application' },
    );
  }

  if (numApplicationsWithoutRouting > 1) {
    const applicationNamesMissingRouting = applicationsWithoutRouting.map(
      ([name]) => name,
    );
    throw new MicrofrontendError(
      `All applications except for the default app must contain the "routing" field. Applications that are missing routing: ${LIST_FORMATTER.format(applicationNamesMissingRouting)}.`,
      { type: 'config', subtype: 'multiple_default_applications' },
    );
  }
};
