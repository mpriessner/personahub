# Story 1.2: CLI Framework Setup

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E1 - Core CLI & Storage  
**Story:** 1.2 - CLI Framework Setup  
**Priority:** 🔴 Must  
**Estimate:** 1 hour  

### What is PersonaHub?
A CLI tool providing "Time Machine" style version control for AI agent configuration files. Users can snapshot, browse history, and restore persona files.

### Why this story?
Sets up the complete CLI command structure. After this, all 6 commands exist (as stubs), ready for implementation.

---

## Dependencies

**Requires:** Story 1.1 (NPM Package Setup)  
**Blocks:** Stories 1.3, 2.1, 2.2, 2.3, 2.4, 3.1

---

## User Story

**As a** developer,  
**I want** a clean CLI with all commands defined,  
**So that** I can discover available functionality easily.

---

## Acceptance Criteria

### AC1: All commands registered
```gherkin
Given PersonaHub is installed
When I run `personahub --help`
Then I see all 6 commands listed:
  | Command | Description |
  | init | Initialize PersonaHub in current directory |
  | save | Create a new snapshot |
  | list | Show snapshot timeline |
  | diff | Compare versions |
  | restore | Restore to a snapshot |
  | serve | Start Time Machine web UI |
```

### AC2: Each command has help
```gherkin
Given PersonaHub is installed
When I run `personahub <command> --help`
Then I see detailed help for that command
And I see available options/arguments
```

### AC3: Commands show "not implemented" for now
```gherkin
Given PersonaHub is installed
When I run `personahub init`
Then I see "Not implemented yet" message
And exit code is 0
```

### AC4: Colored output
```gherkin
Given PersonaHub is installed
When I run any command
Then output uses colors for better readability
And errors are shown in red
And success messages are shown in green
```

---

## Technical Implementation

### File Structure

```
src/
├── cli.ts                 # Main CLI entry (update)
├── index.ts
└── commands/
    ├── index.ts           # Export all commands
    ├── init.ts            # init command (stub)
    ├── save.ts            # save command (stub)
    ├── list.ts            # list command (stub)
    ├── diff.ts            # diff command (stub)
    ├── restore.ts         # restore command (stub)
    └── serve.ts           # serve command (stub)
```

### src/cli.ts (Updated)

```typescript
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
  .description(chalk.cyan('Simplified version control for AI agent personas'))
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
```

### src/commands/init.ts (Example stub)

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize PersonaHub in current directory')
    .option('-f, --force', 'Force re-initialization')
    .action((options) => {
      // TODO: Implement in Story 1.3
      console.log(chalk.yellow('⚠ init command not implemented yet'));
      console.log('Options:', options);
    });
}
```

### src/commands/save.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function saveCommand(program: Command): void {
  program
    .command('save [message]')
    .description('Create a new snapshot')
    .option('-a, --auto', 'Auto-generated message (for cron)')
    .option('-q, --quiet', 'Suppress output')
    .option('--skip-unchanged', 'Skip if no changes detected')
    .action((message, options) => {
      // TODO: Implement in Story 2.1
      console.log(chalk.yellow('⚠ save command not implemented yet'));
    });
}
```

### src/commands/list.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function listCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('Show snapshot timeline')
    .option('-l, --limit <n>', 'Limit number of snapshots', '10')
    .action((options) => {
      // TODO: Implement in Story 2.2
      console.log(chalk.yellow('⚠ list command not implemented yet'));
    });
}
```

### src/commands/diff.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function diffCommand(program: Command): void {
  program
    .command('diff <id> [id2]')
    .description('Compare versions')
    .option('-s, --stat', 'Show summary only')
    .action((id, id2, options) => {
      // TODO: Implement in Story 2.3
      console.log(chalk.yellow('⚠ diff command not implemented yet'));
    });
}
```

### src/commands/restore.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function restoreCommand(program: Command): void {
  program
    .command('restore <id>')
    .description('Restore to a snapshot')
    .option('-f, --force', 'Skip confirmation')
    .action((id, options) => {
      // TODO: Implement in Story 2.4
      console.log(chalk.yellow('⚠ restore command not implemented yet'));
    });
}
```

### src/commands/serve.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function serveCommand(program: Command): void {
  program
    .command('serve')
    .description('Start Time Machine web UI')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('--no-open', 'Do not open browser')
    .action((options) => {
      // TODO: Implement in Story 3.1
      console.log(chalk.yellow('⚠ serve command not implemented yet'));
    });
}
```

### src/commands/index.ts

```typescript
export { initCommand } from './init';
export { saveCommand } from './save';
export { listCommand } from './list';
export { diffCommand } from './diff';
export { restoreCommand } from './restore';
export { serveCommand } from './serve';
```

---

## Testing

### Manual Testing

```bash
# Build and link
npm run build && npm link

# Test help
personahub --help

# Test each command help
personahub init --help
personahub save --help
personahub list --help
personahub diff --help
personahub restore --help
personahub serve --help

# Test stub execution
personahub init
personahub save "test"
personahub list
personahub diff 1
personahub restore 1
personahub serve

# Test unknown command
personahub unknown
```

---

## Definition of Done

- [ ] All 6 command files created in src/commands/
- [ ] src/commands/index.ts exports all commands
- [ ] src/cli.ts imports and registers all commands
- [ ] `personahub --help` shows all commands
- [ ] Each command has working `--help`
- [ ] Each command shows "not implemented" when run
- [ ] Unknown commands show error + help suggestion
- [ ] Output uses chalk colors
- [ ] Code committed to git

---

## Notes for Implementing Agent

- chalk v5 is ESM-only. Either use dynamic import or use chalk v4.1.2 (CommonJS)
- Commander v12 works with CommonJS
- Keep command files small - just registration, real logic comes later
- Use consistent option naming across commands (--force, --quiet, etc.)
