import type { Application, DefaultApplication } from '../types';

export function isDefaultApp(a: Application): a is DefaultApplication {
  return !('routing' in a);
}
