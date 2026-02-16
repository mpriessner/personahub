# Story 2.1: Create Snapshot

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E2 - Snapshot Operations  
**Story:** 2.1 - Create Snapshot  
**Priority:** 🔴 Must  
**Estimate:** 2 hours  

### What is PersonaHub?
A CLI providing "Time Machine" version control for AI agent config files.

### Why this story?
The `save` command is the core operation - it captures the current state of all persona files into a snapshot that can be restored later.

---

## Dependencies

**Requires:** Stories 1.3, 1.4, 1.5 (init, database, config)  
**Blocks:** Stories 2.2, 2.3, 2.4 (need snapshots to exist)

---

## User Story

**As a** developer,  
**I want to** run `personahub save` to create a snapshot,  
**So that** the current state of my personas is preserved.

---

## Acceptance Criteria

### AC1: Basic save
```gherkin
Given PersonaHub is initialized with tracked files
When I run `personahub save "Added humor trait"`
Then all tracked files are copied to .personahub/snapshots/<hash>/
And database records the snapshot with message
And I see "✓ Snapshot created: #1 - Added humor trait (5 files, 12.3 KB)"
```

### AC2: Auto message
```gherkin
Given no message provided
When I run `personahub save`
Then auto-generated message: "Snapshot 2026-02-16 08:46"
```

### AC3: Auto flag for cron
```gherkin
Given `--auto` flag
When I run `personahub save --auto`
Then message is "Auto-snapshot 2026-02-16 08:46"
And is_auto flag set in database
```

### AC4: Quiet mode
```gherkin
Given `--quiet` flag
When I run `personahub save --quiet`
Then no output produced
And exit code 0 on success
```

### AC5: Not initialized error
```gherkin
Given PersonaHub not initialized
When I run `personahub save`
Then error "PersonaHub not initialized. Run 'personahub init' first."
And exit code 1
```

---

## Technical Implementation

### src/commands/save.ts

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { PersonaHubEngine } from '../core/engine';

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
          const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### src/core/engine.ts (additions)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DatabaseManager } from '../storage/database';
import { loadConfig, Config, getConfigPath } from './config';
import { getTrackedFiles, TrackedFile, hashContent } from '../storage/files';

interface CreateSnapshotOptions {
  message: string;
  isAuto?: boolean;
}

interface CreateSnapshotResult {
  id: number;
  hash: string;
  message: string;
  fileCount: number;
  totalSize: number;
}

export class PersonaHubEngine {
  // ... existing methods ...

  private getDb(): DatabaseManager {
    if (!this.db) {
      const dbPath = path.join(this.personahubDir, 'history.db');
      this.db = new DatabaseManager(dbPath);
    }
    return this.db;
  }

  private getConfig(): Config {
    if (!this.config) {
      this.config = loadConfig(getConfigPath(this.workDir));
    }
    return this.config;
  }

  createSnapshot(options: CreateSnapshotOptions): CreateSnapshotResult {
    this.ensureInitialized();
    
    const config = this.getConfig();
    const db = this.getDb();
    
    // Get all tracked files
    const files = getTrackedFiles(this.workDir, config);
    
    // Calculate total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    
    // Generate snapshot hash from file hashes
    const combinedHash = this.generateSnapshotHash(files);
    
    // Create snapshot directory
    const snapshotDir = path.join(this.personahubDir, 'snapshots', combinedHash);
    fs.mkdirSync(snapshotDir, { recursive: true });
    
    // Copy files to snapshot
    for (const file of files) {
      const destPath = path.join(snapshotDir, file.relativePath);
      const destDir = path.dirname(destPath);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(file.path, destPath);
    }
    
    // Insert database records
    const snapshotId = db.insertSnapshot({
      hash: combinedHash,
      message: options.message,
      file_count: files.length,
      total_size: totalSize,
      is_auto: options.isAuto || false
    });
    
    db.insertFiles(snapshotId, files.map(f => ({
      path: f.relativePath,
      hash: f.hash,
      size: f.size
    })));
    
    return {
      id: snapshotId,
      hash: combinedHash,
      message: options.message,
      fileCount: files.length,
      totalSize
    };
  }

  private generateSnapshotHash(files: TrackedFile[]): string {
    // Combine all file paths and hashes
    const content = files
      .map(f => `${f.relativePath}:${f.hash}`)
      .join('\n');
    
    return hashContent(content);
  }

  hasChanges(): boolean {
    const db = this.getDb();
    const latest = db.getLatestSnapshot();
    
    if (!latest) return true; // No snapshots = has changes
    
    const config = this.getConfig();
    const currentFiles = getTrackedFiles(this.workDir, config);
    const currentHash = this.generateSnapshotHash(currentFiles);
    
    return currentHash !== latest.hash;
  }
}
```

---

## Testing

### Manual Testing

```bash
# Setup
mkdir /tmp/test-save && cd /tmp/test-save
echo "# Soul" > SOUL.md
echo "# Memory" > MEMORY.md
personahub init

# Test basic save
personahub save "First snapshot"
# ✓ Snapshot created: #1 - First snapshot (2 files, 15 B)

# Test auto message
personahub save
# ✓ Snapshot created: #2 - Snapshot 2026-02-16 09:30 (2 files, 15 B)

# Test --auto flag
personahub save --auto
# ✓ Snapshot created: #3 - Auto-snapshot 2026-02-16 09:31 (2 files, 15 B)

# Test --quiet
personahub save --quiet
echo $?  # Should be 0

# Test skip unchanged
personahub save --skip-unchanged
# No changes detected, skipping snapshot

# Modify file and try again
echo "new content" >> SOUL.md
personahub save --skip-unchanged
# ✓ Snapshot created...

# Verify files saved
ls .personahub/snapshots/
```

---

## Definition of Done

- [ ] save command fully implemented
- [ ] Files copied to snapshots/<hash>/
- [ ] Database records created
- [ ] Message auto-generated if not provided
- [ ] --auto flag sets is_auto
- [ ] --quiet suppresses output
- [ ] --skip-unchanged works
- [ ] Error handling for not initialized
- [ ] Code committed to git

---

## Notes for Implementing Agent

- Copy files preserving directory structure
- Hash is 12-char truncated SHA-256
- Use transactions for database inserts
- Handle large files gracefully
- Exit code 0 on success, 1 on error
