import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const WORKSPACE_ROOT = join(process.cwd(), '..', '..');

const DEV_TASKS = [
  'nextjs-app-docs#dev',
  'nextjs-app-marketing#dev',
  'nextjs-pages-blog#dev',
  'nextjs-pages-dashboard#dev',
  'react-router-docs#dev',
  'react-router-vite-base-path-different-than-vercel-project-name#dev',
  'react-router-web#dev',
  'sveltekit-docs#dev',
  'sveltekit-web#dev',
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
    checkDevTask,
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

function checkDevTask(devTask: string): {
  devTask: string;
  hasProxyTask: boolean;
  errorMessage?: string;
} {
  const result = spawnSync('turbo', ['run', devTask, '--dry=json'], {
    stdio: 'pipe',
    encoding: 'utf8',
    cwd: WORKSPACE_ROOT,
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
