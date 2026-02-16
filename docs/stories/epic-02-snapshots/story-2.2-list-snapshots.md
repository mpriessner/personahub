# Story 2.2: List Snapshots (Timeline)

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E2 - Snapshot Operations  
**Story:** 2.2 - List Snapshots  
**Priority:** 🔴 Must  
**Estimate:** 1 hour  

---

## Dependencies

**Requires:** Story 2.1 (snapshots must exist)  
**Blocks:** None

---

## User Story

**As a** developer,  
**I want to** run `personahub list` to see all snapshots,  
**So that** I can browse the history.

---

## Acceptance Criteria

### AC1: Display timeline
```gherkin
Given multiple snapshots exist
When I run `personahub list`
Then I see formatted timeline:
```
```
PersonaHub Timeline (5 snapshots)
─────────────────────────────────

  #5  2026-02-16 08:46  Added humor trait         5 files   12.3 KB
  #4  2026-02-15 06:00  Auto-snapshot            5 files   11.8 KB  🕐
  #3  2026-02-14 06:00  Auto-snapshot            4 files   10.2 KB  🕐
  #2  2026-02-13 14:22  Updated memory           4 files    9.5 KB
  #1  2026-02-12 10:00  Initial setup            3 files    5.1 KB

Use 'personahub diff <id>' to compare | 'personahub restore <id>' to restore
```

### AC2: Limit results
```gherkin
Given `--limit 3`
When I run `personahub list --limit 3`
Then only 3 most recent shown
```

### AC3: Empty state
```gherkin
Given no snapshots exist
When I run `personahub list`
Then "No snapshots yet. Run 'personahub save' to create one."
```

---

## Technical Implementation

### src/commands/list.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { PersonaHubEngine } from '../core/engine';

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
        console.log(chalk.dim('─'.repeat(50)));
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

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len - 3) + '...' : str;
}
```

### src/core/engine.ts (additions)

```typescript
interface Snapshot {
  id: number;
  hash: string;
  message: string | null;
  createdAt: string;
  fileCount: number;
  totalSize: number;
  isAuto: boolean;
  isRestoreBackup: boolean;
}

// In PersonaHubEngine class:
listSnapshots(limit?: number): Snapshot[] {
  this.ensureInitialized();
  const db = this.getDb();
  const rows = db.getSnapshots(limit);
  
  return rows.map(row => ({
    id: row.id,
    hash: row.hash,
    message: row.message,
    createdAt: row.created_at,
    fileCount: row.file_count,
    totalSize: row.total_size,
    isAuto: row.is_auto === 1,
    isRestoreBackup: row.is_restore_backup === 1
  }));
}
```

---

## Testing

### Manual Testing

```bash
# Create some snapshots first
personahub save "First"
personahub save "Second"
personahub save --auto
personahub save "Fourth"

# List all
personahub list

# Limit
personahub list --limit 2

# Empty state (new directory)
mkdir /tmp/empty && cd /tmp/empty
personahub init
personahub list
```

---

## Definition of Done

- [ ] list command shows all snapshots
- [ ] Newest first ordering
- [ ] Shows ID, date, message, files, size
- [ ] Auto snapshots marked with 🕐
- [ ] --limit option works
- [ ] Empty state message shown
- [ ] Helpful footer with next commands
- [ ] Code committed to git
