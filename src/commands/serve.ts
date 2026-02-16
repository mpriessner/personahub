import { Command } from 'commander';
import chalk from 'chalk';

export function serveCommand(program: Command): void {
  program
    .command('serve')
    .description('Start Time Machine web UI')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('--no-open', 'Do not open browser')
    .action((options) => {
      // TODO: Implement in Epic 3
      console.log(chalk.yellow('⚠ Web UI not yet implemented'));
      console.log(`  Will serve on port ${options.port}`);
      console.log(`  Auto-open browser: ${options.open}`);
    });
}
