#!/usr/bin/env node

const { execSync } = require('child_process');

const OUTPUT_DIR = '/private/tmp/vercel-microfrontends';

async function main() {
  execSync('pnpm build -F @vercel/microfrontends', { stdio: 'inherit' });
  execSync(`rm -rf ${OUTPUT_DIR}`, { stdio: 'inherit' });
  execSync(
    `(cd packages/microfrontends && pnpm pack --pack-destination=${OUTPUT_DIR})`,
    { stdio: 'inherit' },
  );
  const packageTarball = execSync(`ls ${OUTPUT_DIR}`).toString().trim();
  execSync(
    `vc link --cwd ${OUTPUT_DIR} --scope microfrontends-vtest314 --project local-releases --yes`,
  );
  execSync(
    `jq -n '{ rewrites: [ { "source": "/", "destination": "/${packageTarball}" } ] }' > ${OUTPUT_DIR}/vercel.json`,
  );
  const deploymentUrl = execSync(
    `vc --cwd ${OUTPUT_DIR} --prod --scope=microfrontends-vtest314`,
  )
    .toString()
    .trim();
  console.log('------------------------------------');
  console.log(
    `  A new deployment has been created with your local changes. Use ${deploymentUrl} in the place of the normal package version.`,
  );
  console.log('------------------------------------');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
