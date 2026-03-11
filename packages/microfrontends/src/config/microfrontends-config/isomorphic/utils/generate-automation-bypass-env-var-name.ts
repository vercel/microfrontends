/**
 * Generates a per-application automation bypass env var name (e.g. `AUTOMATION_BYPASS_DOCS`).
 *
 * @deprecated Prefer using a single shared `VERCEL_AUTOMATION_BYPASS_SECRET` across all projects.
 * Use this only if each project needs its own distinct bypass secret.
 */
export function generateAutomationBypassEnvVarName({
  name,
}: {
  name: string;
}): string {
  return `AUTOMATION_BYPASS_${name.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
}
