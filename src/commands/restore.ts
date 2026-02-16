import { Command } from 'commander';
import chalk from 'chalk';
import * as readline from 'readline';
import { PersonaHubEngine } from '../core/engine';

export function restoreCommand(program: Command): void {
  program
    .command('restore <id>')
    .description('Restore to a snapshot')
    .option('-f, --force', 'Skip confirmation')
    .action(async (id, options) => {
      try {
        const engine = new PersonaHubEngine(process.cwd());
        engine.ensureInitialized();

        const snapshotId = parseInt(id, 10);
        if (isNaN(snapshotId) || snapshotId < 1) {
          throw new Error('Invalid snapshot ID');
        }
        
        // Preview
        const preview = engine.getRestorePreview(snapshotId);
        
        console.log(chalk.bold(`\nRestore to snapshot #${snapshotId}?\n`));
        console.log(`This will:`);
        if (preview.overwrite.length > 0) {
          console.log(chalk.yellow(`  • Overwrite ${preview.overwrite.length} files`));
        }
        if (preview.remove.length > 0) {
          console.log(chalk.red(`  • ${preview.remove.length} files will be orphaned (not in snapshot)`));
        }
        if (preview.restore.length > 0) {
          console.log(chalk.green(`  • Restore ${preview.restore.length} files (deleted since snapshot)`));
        }
        console.log(chalk.dim(`  • A backup snapshot will be created first\n`));

        // Confirm
        if (!options.force) {
          const confirmed = await confirm('Proceed? (y/N) ');
          if (!confirmed) {
            console.log('Restore cancelled');
            return;
          }
        }

        // Execute restore
        const result = engine.restore(snapshotId);

        console.log(chalk.green(`\n✓ Restored to snapshot #${snapshotId}`));
        console.log(chalk.dim(`  Backup created: #${result.backupId}`));

      } catch (error: any) {
        console.error(chalk.red('✗'), error.message);
        process.exit(1);
      }
    });
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}
