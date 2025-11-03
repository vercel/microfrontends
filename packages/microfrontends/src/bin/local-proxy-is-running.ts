export function localProxyIsRunning(): boolean {
  return Boolean(process.env.TURBO_TASK_HAS_MFE_PROXY);
}
