export function displayLocalProxyInfo(port: number): void {
  // TODO(olszewski): this is really icky, but since withMicroFrontends is called by two separate processes
  // we can't rely on some shared state so we instead use env to store state
  const { MFE_PROXY_MESSAGE_PRINTED, TURBO_TASK_HAS_MFE_PROXY } = process.env;
  if (
    TURBO_TASK_HAS_MFE_PROXY === 'true' &&
    MFE_PROXY_MESSAGE_PRINTED !== 'true'
  ) {
    process.env.MFE_PROXY_MESSAGE_PRINTED = 'true';
    // eslint-disable-next-line no-console
    console.log(`Microfrontends Proxy running on http://localhost:${port}`);
  }
}
