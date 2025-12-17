import type { ApplicationId, PathGroup } from '../../schema/types';

export interface ClientApplication {
  routing?: PathGroup[];
  default?: boolean;
}

export interface ClientConfig {
  applications: Record<ApplicationId, ClientApplication>;
  hasFlaggedPaths?: boolean;
}
