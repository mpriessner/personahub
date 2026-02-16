import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from '../ui/server';

export function serveCommand(program: Command): void {
  program
    .command('serve')
    .description('Start Time Machine web UI')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('--no-open', 'Do not open browser')
    .action(async (options) => {
      try {
        const port = parseInt(options.port, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          console.error(chalk.red('✗ Invalid port number'));
          process.exit(1);
        }
        
        await startServer({
          port,
          open: options.open,
          workDir: process.cwd()
        });
        
      } catch (error: any) {
        console.error(chalk.red('✗'), error.message);
        process.exit(1);
      }
    });
}
