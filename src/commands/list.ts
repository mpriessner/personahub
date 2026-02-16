import { Command } from 'commander';
import chalk from 'chalk';
import { PersonaHubEngine } from '../core/engine';
import { formatSize, formatDate, truncate } from '../utils/format';

export function listCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('Show snapshot timeline')
    .option('-l, --limit <n>', 'Limit number of snapshots', '20')
    .action((options) => {
      try {
        const engine = new PersonaHubEngine(process.cwd());
        engine.ensureInitialized();

        const limit = parseInt(options.limit, 10);
        const snapshots = engine.listSnapshots(limit);

        if (snapshots.length === 0) {
          console.log(chalk.yellow("No snapshots yet."));
          console.log(`Run ${chalk.cyan('personahub save')} to create one.`);
          return;
        }

        // Header
        console.log(chalk.bold(`\nPersonaHub Timeline (${snapshots.length} snapshots)`));
        console.log(chalk.dim('─'.repeat(60)));
        console.log();

        // Snapshots
        for (const snap of snapshots) {
          const date = formatDate(snap.createdAt);
          const msg = truncate(snap.message || '(no message)', 30);
          const size = formatSize(snap.totalSize);
          const autoIcon = snap.isAuto ? chalk.dim(' 🕐') : '';
          const backupIcon = snap.isRestoreBackup ? chalk.dim(' 💾') : '';
          
          console.log(
            chalk.cyan(`  #${snap.id.toString().padStart(3)}`),
            chalk.dim(date),
            msg.padEnd(32),
            chalk.dim(`${snap.fileCount} files`.padStart(8)),
            chalk.dim(size.padStart(10)),
            autoIcon,
            backupIcon
          );
        }

        console.log();
        console.log(chalk.dim(
          `Use ${chalk.cyan('personahub diff <id>')} to compare | ` +
          `${chalk.cyan('personahub restore <id>')} to restore`
        ));

      } catch (error: any) {
        console.error(chalk.red('✗'), error.message);
        process.exit(1);
      }
    });
}
