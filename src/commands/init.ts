import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { PersonaHubEngine } from '../core/engine';

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize PersonaHub in current directory')
    .option('-f, --force', 'Force re-initialization')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const personahubDir = path.join(cwd, '.personahub');
        
        // Check if already initialized
        if (fs.existsSync(personahubDir) && !options.force) {
          console.error(chalk.red('✗ PersonaHub already initialized in this directory'));
          console.log(`Use ${chalk.cyan('--force')} to re-initialize`);
          process.exit(1);
        }
        
        // Backup if force
        if (fs.existsSync(personahubDir) && options.force) {
          const timestamp = Date.now();
          const backupDir = `${personahubDir}.backup.${timestamp}`;
          fs.renameSync(personahubDir, backupDir);
          console.log(chalk.yellow(`⚠ Backed up existing to ${path.basename(backupDir)}`));
        }
        
        // Initialize
        const engine = new PersonaHubEngine(cwd);
        const result = await engine.init();
        
        console.log(chalk.green('✓ PersonaHub initialized'));
        console.log(`  Found ${chalk.cyan(result.fileCount.toString())} files matching patterns`);
        console.log(`  Config: ${chalk.dim('.personahub/config.json')}`);
        console.log(`\nRun ${chalk.cyan('personahub save')} to create your first snapshot`);
        
      } catch (error: any) {
        console.error(chalk.red('✗ Initialization failed:'), error.message);
        process.exit(1);
      }
    });
}
