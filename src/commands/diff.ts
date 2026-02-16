import { Command } from 'commander';
import chalk from 'chalk';
import { PersonaHubEngine } from '../core/engine';

export function diffCommand(program: Command): void {
  program
    .command('diff <id> [id2]')
    .description('Compare versions')
    .option('-s, --stat', 'Show summary only')
    .action(async (id, id2, options) => {
      try {
        const engine = new PersonaHubEngine(process.cwd());
        engine.ensureInitialized();

        const snapshotId = parseInt(id, 10);
        if (isNaN(snapshotId) || snapshotId < 1) {
          throw new Error('Invalid snapshot ID');
        }

        const compareToId = id2 ? parseInt(id2, 10) : null;
        if (compareToId !== null && (isNaN(compareToId) || compareToId < 1)) {
          throw new Error('Invalid comparison snapshot ID');
        }

        const result = await engine.diff(snapshotId, compareToId);

        // Header
        if (compareToId) {
          console.log(chalk.bold(`\nComparing snapshot #${snapshotId} with #${compareToId}\n`));
        } else {
          console.log(chalk.bold(`\nComparing snapshot #${snapshotId} with current\n`));
        }

        // Summary
        const added = result.added.length;
        const removed = result.removed.length;
        const modified = result.modified.length;

        if (added === 0 && removed === 0 && modified === 0) {
          console.log(chalk.green('No differences'));
          return;
        }

        console.log(`Files changed: ${chalk.green(`${added} added`)}, ${chalk.red(`${removed} removed`)}, ${chalk.yellow(`${modified} modified`)}\n`);

        // File list
        for (const file of result.added) {
          console.log(chalk.green(`+ ${file} (new)`));
        }
        for (const file of result.removed) {
          console.log(chalk.red(`- ${file} (deleted)`));
        }
        for (const mod of result.modified) {
          console.log(chalk.yellow(`~ ${mod.path} (${mod.linesChanged} lines changed)`));
        }

        // Line-level diff (unless --stat)
        if (!options.stat && result.modified.length > 0) {
          console.log();
          for (const mod of result.modified) {
            console.log(chalk.dim(`─── ${mod.path} ${'─'.repeat(Math.max(0, 40 - mod.path.length))}`));
            console.log(mod.diff);
            console.log();
          }
        }

      } catch (error: any) {
        console.error(chalk.red('✗'), error.message);
        process.exit(1);
      }
    });
}
