#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/pageLoader.js';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output <dir>', 'output dir (default: "/home/user/current-dir")', process.cwd())
  .argument('<url>', 'url to download')
  .action((url, options) => {
    pageLoader(url, options.output)
      .then((path) => {
        console.log(`Página descargada en: ${path}`);
        process.exit(0);
      })
      .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      });
  });

program.parse(process.argv);

