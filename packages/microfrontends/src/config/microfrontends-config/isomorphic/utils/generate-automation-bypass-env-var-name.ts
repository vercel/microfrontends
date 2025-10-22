export function generateAutomationBypassEnvVarName({
  name,
}: {
  name: string;
}): string {
  return `AUTOMATION_BYPASS_${name.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
}
