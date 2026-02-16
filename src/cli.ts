#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { saveCommand } from './commands/save';
import { listCommand } from './commands/list';
import { diffCommand } from './commands/diff';
import { restoreCommand } from './commands/restore';
import { serveCommand } from './commands/serve';

const program = new Command();

program
  .name('personahub')
  .description(chalk.cyan('🕐 Simplified version control for AI agent personas'))
  .version('0.1.0');

// Register all commands
initCommand(program);
saveCommand(program);
listCommand(program);
diffCommand(program);
restoreCommand(program);
serveCommand(program);

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`));
  console.log(`Run ${chalk.cyan('personahub --help')} to see available commands.`);
  process.exit(1);
});

program.parse();
