import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const WORKSPACE_ROOT = join(process.cwd(), '..', '..');

const DEV_TASKS = [
  {
    task: 'nextjs-app-docs#dev',
    env: { VC_MICROFRONTENDS_CONFIG_FILE_NAME: 'microfrontends-custom.jsonc' },
  },
  {
    task: 'nextjs-app-marketing#dev',
    env: { VC_MICROFRONTENDS_CONFIG_FILE_NAME: 'microfrontends-custom.jsonc' },
  },
  { task: 'nextjs-pages-blog#dev' },
  { task: 'nextjs-pages-dashboard#dev' },
  { task: 'react-router-docs#dev' },
  {
    task: 'react-router-vite-base-path-different-than-vercel-project-name#dev',
  },
  { task: 'react-router-web#dev' },
  { task: 'sveltekit-docs#dev' },
  { task: 'sveltekit-web#dev' },
];

interface DryRunOutput {
  tasks: {
    taskId: string;
    task: string;
  }[];
}

function main() {
  // dry run all tasks
  const missingProxyTask = [];
  const failed = [];
  for (const { devTask, hasProxyTask, errorMessage } of DEV_TASKS.map(
    ({ task, env }) => checkDevTask(task, env),
  )) {
    if (errorMessage) {
      failed.push(`${devTask}: turbo dry run failed: ${errorMessage}`);
    }
    if (!hasProxyTask) {
      missingProxyTask.push(`${devTask}: No proxy found in dry run`);
    }
  }

  if (failed.length > 0 || missingProxyTask.length > 0) {
    console.error(
      `Not all dev tasks started the local proxy: \n${failed.join('\n')}\n${missingProxyTask.join('\n')}`,
    );
    process.exit(1);
  }
}

function checkDevTask(
  devTask: string,
  env: Record<string, string> | undefined,
): {
  devTask: string;
  hasProxyTask: boolean;
  errorMessage?: string;
} {
  const result = spawnSync('turbo', ['run', devTask, '--dry=json'], {
    stdio: 'pipe',
    encoding: 'utf8',
    cwd: WORKSPACE_ROOT,
    env: { ...process.env, ...env },
  });
  if (result.error) {
    return { devTask, hasProxyTask: false, errorMessage: result.error.message };
  }
  const dryRunJson = JSON.parse(result.stdout) as DryRunOutput;
  const hasProxyTask =
    dryRunJson.tasks.find((task) => task.task === 'proxy') !== undefined;
  return { devTask, hasProxyTask };
}

main();
