export function localProxyIsRunning(): boolean {
  return process.env.TURBO_TASK_HAS_MFE_PROXY === 'true';
}
