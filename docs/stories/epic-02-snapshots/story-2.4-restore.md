# Story 2.4: Restore Snapshot

## Context

**Project:** PersonaHub  
**Epic:** E2 - Snapshot Operations  
**Story:** 2.4 - Restore  
**Priority:** 🔴 Must  
**Estimate:** 2 hours  

---

## Dependencies

**Requires:** Story 2.1  
**Blocks:** None

---

## User Story

**As a** developer,  
**I want to** run `personahub restore <id>` to rollback,  
**So that** I can recover from unwanted changes.

---

## Acceptance Criteria

### AC1: Preview and confirm
```gherkin
When I run `personahub restore 3`
Then I see preview of changes
And prompted "Restore to snapshot #3? (y/N)"
```

### AC2: Creates backup first
```gherkin
Given I confirm restore
When restore executes
Then backup snapshot created automatically FIRST
And files replaced with snapshot #3 versions
And "✓ Restored to snapshot #3 (backup: #6)"
```

### AC3: Force skip confirmation
```gherkin
When I run `personahub restore 3 --force`
Then no confirmation asked
And restore proceeds immediately
```

### AC4: Invalid snapshot
```gherkin
When I run `personahub restore 999`
Then error "Snapshot #999 not found"
```

---

## Technical Implementation

### src/commands/restore.ts

```typescript
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
        
        // Preview
        const preview = engine.getRestorePreview(snapshotId);
        
        console.log(chalk.bold(`\nRestore to snapshot #${snapshotId}?\n`));
        console.log(`This will:`);
        if (preview.overwrite.length > 0) {
          console.log(chalk.yellow(`  • Overwrite ${preview.overwrite.length} files`));
        }
        if (preview.remove.length > 0) {
          console.log(chalk.red(`  • Remove ${preview.remove.length} files (added after snapshot)`));
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
```

### src/core/engine.ts (restore methods)

```typescript
interface RestorePreview {
  overwrite: string[];
  remove: string[];
  restore: string[];
}

interface RestoreResult {
  backupId: number;
  restoredFiles: number;
}

// In PersonaHubEngine class:
getRestorePreview(snapshotId: number): RestorePreview {
  this.ensureInitialized();
  const db = this.getDb();
  
  const snapshot = db.getSnapshotById(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot #${snapshotId} not found`);
  }
  
  const snapshotFiles = db.getFilesForSnapshot(snapshotId);
  const snapshotPaths = new Set(snapshotFiles.map(f => f.path));
  
  const config = this.getConfig();
  const currentFiles = getTrackedFiles(this.workDir, config);
  const currentPaths = new Set(currentFiles.map(f => f.relativePath));
  
  const overwrite: string[] = [];
  const remove: string[] = [];
  const restore: string[] = [];
  
  // Files in snapshot
  for (const path of snapshotPaths) {
    if (currentPaths.has(path)) {
      overwrite.push(path);
    } else {
      restore.push(path);
    }
  }
  
  // Files not in snapshot (will be orphaned, not removed)
  for (const path of currentPaths) {
    if (!snapshotPaths.has(path)) {
      remove.push(path);
    }
  }
  
  return { overwrite, remove, restore };
}

restore(snapshotId: number): RestoreResult {
  this.ensureInitialized();
  const db = this.getDb();
  
  const snapshot = db.getSnapshotById(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot #${snapshotId} not found`);
  }
  
  // CRITICAL: Create backup FIRST
  const backup = this.createSnapshot({
    message: `Backup before restore to #${snapshotId}`,
    isAuto: false,
    isRestoreBackup: true
  });
  
  // Get snapshot files
  const snapshotFiles = db.getFilesForSnapshot(snapshotId);
  const snapshotDir = path.join(this.personahubDir, 'snapshots', snapshot.hash);
  
  // Copy files from snapshot to working directory
  for (const file of snapshotFiles) {
    const srcPath = path.join(snapshotDir, file.path);
    const destPath = path.join(this.workDir, file.path);
    
    // Create directory if needed
    const destDir = path.dirname(destPath);
    fs.mkdirSync(destDir, { recursive: true });
    
    // Copy file
    fs.copyFileSync(srcPath, destPath);
  }
  
  return {
    backupId: backup.id,
    restoredFiles: snapshotFiles.length
  };
}
```

---

## Testing

### Manual Testing

```bash
# Setup
personahub save "original"
echo "modified" >> SOUL.md
echo "new file" > NEW.md
personahub save "modified"

# Test restore preview
personahub restore 1
# Should show preview, ask confirmation

# Cancel
# Press N

# Force restore
personahub restore 1 --force
# Should restore without asking

# Verify
cat SOUL.md  # Should be original content
personahub list  # Should show backup snapshot
```

---

## Definition of Done

- [ ] Shows preview before restore
- [ ] Asks for confirmation
- [ ] `--force` skips confirmation
- [ ] Creates backup snapshot BEFORE restoring
- [ ] Marks backup with is_restore_backup
- [ ] Copies all files from snapshot
- [ ] Handles nested directories
- [ ] Error for invalid snapshot ID
- [ ] Code committed to git

---

## Critical Notes

⚠️ **ALWAYS create backup before any file modifications**
⚠️ **Never delete files automatically - only overwrite**

## Review Fixes Applied

### ⚠️ ATOMIC RESTORE (Critical Fix)

The restore operation MUST be atomic. If interrupted mid-restore, workspace could be corrupted.

**Solution - Staging Directory:**
```typescript
restore(snapshotId: number): RestoreResult {
  // 1. Create backup FIRST
  const backup = this.createSnapshot({ message: `Backup before restore to #${snapshotId}` });
  
  // 2. Restore to STAGING directory first
  const stagingDir = path.join(this.personahubDir, 'staging');
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });
  
  for (const file of snapshotFiles) {
    const srcPath = path.join(snapshotDir, file.path);
    const stagingPath = path.join(stagingDir, file.path);
    fs.mkdirSync(path.dirname(stagingPath), { recursive: true });
    fs.copyFileSync(srcPath, stagingPath);
  }
  
  // 3. Verify all files copied correctly
  for (const file of snapshotFiles) {
    const stagingPath = path.join(stagingDir, file.path);
    if (!fs.existsSync(stagingPath)) {
      throw new Error(`Staging failed for ${file.path}`);
    }
  }
  
  // 4. Move from staging to workspace (as atomic as possible)
  for (const file of snapshotFiles) {
    const stagingPath = path.join(stagingDir, file.path);
    const destPath = path.join(this.workDir, file.path);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.renameSync(stagingPath, destPath); // rename is atomic on same filesystem
  }
  
  // 5. Cleanup staging
  fs.rmSync(stagingDir, { recursive: true, force: true });
  
  return { backupId: backup.id, restoredFiles: snapshotFiles.length };
}
```

### Other Fixes
- ✅ Input validation for snapshot ID
- ✅ Path traversal check on all file operations
- ✅ Verify file hashes match after restore (integrity check)
