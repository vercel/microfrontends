import { generateAutomationBypassEnvVarName } from './generate-automation-bypass-env-var-name';

describe('generateAutomationBypassEnvVarName', () => {
  it.each([
    { name: 'foo', expected: 'AUTOMATION_BYPASS_FOO' },
    { name: 'foo-bar', expected: 'AUTOMATION_BYPASS_FOO_BAR' },
    { name: 'foo_bar', expected: 'AUTOMATION_BYPASS_FOO_BAR' },
    { name: 'F10oO', expected: 'AUTOMATION_BYPASS_F10OO' },
    { name: 'foo.bar', expected: 'AUTOMATION_BYPASS_FOO_BAR' },
  ])('generates the correct env var name for %s', ({ name, expected }) => {
    expect(generateAutomationBypassEnvVarName({ name })).toBe(expected);
  });
});
