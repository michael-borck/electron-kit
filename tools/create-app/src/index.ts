#!/usr/bin/env node

import { Command } from 'commander';
import { createApp } from './createApp';
import { validateProjectName } from './utils';

const program = new Command();

program
  .name('create-electron-kit')
  .description('Create a new Electron application from modular templates')
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project to create')
  .option('-t, --template <template>', 'Template to use (basic, ai-app, data-app, research-app, full)')
  .option('--skip-git', 'Skip git initialization')
  .option('--skip-install', 'Skip npm install')
  .action(async (projectName, options) => {
    try {
      await createApp(projectName, options);
    } catch (error) {
      console.error('Error creating project:', error);
      process.exit(1);
    }
  });

program.parse();