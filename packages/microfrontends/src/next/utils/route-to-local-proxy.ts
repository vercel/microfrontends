export function routeToLocalProxy(): boolean {
  const isDevEnv = (process.env.VERCEL_ENV ?? 'development') === 'development';

  return isDevEnv && Boolean(process.env.TURBO_TASK_HAS_MFE_PROXY);
}
