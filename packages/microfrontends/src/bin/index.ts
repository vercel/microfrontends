#!/usr/bin/env node

import { loadEnvConfig } from '@next/env';
import { Command, Option } from 'commander';
import cliPkg from '../../package.json';
import { LocalProxy } from './local-proxy';
import { displayPort } from './port';
import type { LocalProxyOptions } from './types';

function main(): void {
  loadEnvConfig(process.cwd());
  const program = new Command();

  program
    .name(cliPkg.name)
    .description('Tools for working with micro-frontend applications')
    .version(cliPkg.version, '-v, --version', 'output the current version');

  program
    .command('proxy')
    .argument('[filePath]', 'Path to the micro-frontend configuration file')
    .option(
      '--local-apps <names...>',
      'List of locally running applications',
      [],
    )
    // TODO: remove the --names option once Turbo no longer uses it.`
    .addOption(new Option('--names <names...>').hideHelp())
    .option('--port <port>', 'Port proxy will use', (value) => {
      const parsedValue = Number.parseInt(value, 10);
      if (isNaN(parsedValue) || parsedValue <= 0) {
        throw new Error(
          'The value passed in to --port must be a positive number.',
        );
      }
      return parsedValue;
    })
    .action((filePath: string | undefined, options: LocalProxyOptions) => {
      if (options.names && options.localApps.length) {
        throw new Error(
          'Both --names and --local-apps are set. --names is deprecated and has been replaced with --local-apps, which functions exactly the same. Please only set --local-apps.',
        );
      }
      const localProxy = LocalProxy.fromFile(filePath, {
        localApps: options.names ?? options.localApps,
        proxyPort: options.port,
      });
      localProxy.startServer();
    });

  program
    .command('port')
    .description('Prints development port')
    .action(() => {
      displayPort();
    });

  program.parse(process.argv);
}

main();
