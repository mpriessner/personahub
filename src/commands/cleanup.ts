import { Command } from 'commander';
import chalk from 'chalk';
import { PersonaHubEngine } from '../core/engine';

export function cleanupCommand(program: Command): void {
  program
    .command('cleanup')
    .description('Remove old snapshots based on retention policy')
    .option('-n, --dry-run', 'Show what would be deleted without deleting')
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      try {
        const engine = new PersonaHubEngine(process.cwd());
        engine.ensureInitialized();

        if (options.dryRun) {
          // For dry-run, just show what would be deleted
          const snapshots = await engine.listSnapshots();
          const config = engine['getConfig']();
          const retention = config.retention || {
            autoSnapshotDays: 7,
            manualSnapshotDays: 30,
            minSnapshots: 5
          };
          
          if (!options.quiet) {
            console.log(chalk.bold('Retention Policy:'));
            console.log(`  Auto snapshots: ${retention.autoSnapshotDays} days`);
            console.log(`  Manual snapshots: ${retention.manualSnapshotDays} days`);
            console.log(`  Minimum kept: ${retention.minSnapshots}\n`);
            console.log(chalk.yellow('Dry run - no changes made'));
          }
          return;
        }

        const result = await engine.cleanup();

        if (!options.quiet) {
          if (result.deleted === 0) {
            console.log(chalk.green('✓ No snapshots to clean up'));
          } else {
            console.log(chalk.green(`✓ Cleaned up ${result.deleted} old snapshots`));
          }
          console.log(chalk.dim(`  ${result.kept} snapshots kept`));
        }

      } catch (error: any) {
        if (!options.quiet) {
          console.error(chalk.red('✗'), error.message);
        }
        process.exit(1);
      }
    });
}
