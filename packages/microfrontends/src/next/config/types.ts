import type { TransformKeys } from './transforms';

export interface WithMicrofrontendsOptions {
  /**
   * Explicitly set the name of the application instead of using the name from the package.json.
   * This option is useful for cases where you are trying to import next.config.js in a different
   * package, such as for the Storybook Next.js integration.
   *
   * NOTE: This option should not be used in most cases. Issues on Vercel may occur
   * if it differs from the project name.
   */
  appName?: string;
  isProduction?: () => boolean;
  debug?: boolean;
  skipTransforms?: TransformKeys[];
  /**
   * True to enable support for Next.js pages router. This is disabled by
   * default since it modifies Webpack chunking behavior, so it should only be
   * enabled when necessary.
   */
  supportPagesRouter?: boolean;
  configPath?: string;
}
