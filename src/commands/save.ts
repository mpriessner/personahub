import { Command } from 'commander';
import chalk from 'chalk';
import { PersonaHubEngine } from '../core/engine';
import { formatSize } from '../utils/format';

export function saveCommand(program: Command): void {
  program
    .command('save [message]')
    .description('Create a new snapshot')
    .option('-a, --auto', 'Auto-generated message (for cron)')
    .option('-q, --quiet', 'Suppress output')
    .option('--skip-unchanged', 'Skip if no changes detected')
    .action((message, options) => {
      try {
        const engine = new PersonaHubEngine(process.cwd());
        engine.ensureInitialized();

        // Generate message
        let snapshotMessage = message;
        if (!snapshotMessage) {
          const now = new Date();
          const dateStr = new Intl.DateTimeFormat('en-CA', {
            dateStyle: 'short',
            timeStyle: 'short',
            hour12: false
          }).format(now);
          snapshotMessage = options.auto 
            ? `Auto-snapshot ${dateStr}`
            : `Snapshot ${dateStr}`;
        }

        // Check for changes if requested
        if (options.skipUnchanged) {
          const hasChanges = engine.hasChanges();
          if (!hasChanges) {
            if (!options.quiet) {
              console.log(chalk.yellow('No changes detected, skipping snapshot'));
            }
            process.exit(0);
          }
        }

        // Create snapshot
        const result = engine.createSnapshot({
          message: snapshotMessage,
          isAuto: options.auto || false
        });

        if (!options.quiet) {
          const sizeStr = formatSize(result.totalSize);
          console.log(chalk.green(`✓ Snapshot created: #${result.id} - ${snapshotMessage}`));
          console.log(chalk.dim(`  ${result.fileCount} files, ${sizeStr}`));
        }

      } catch (error: any) {
        if (!options.quiet) {
          console.error(chalk.red('✗'), error.message);
        }
        process.exit(1);
      }
    });
}
