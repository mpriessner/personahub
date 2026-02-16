# Story 1.3: Project Initialization

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E1 - Core CLI & Storage  
**Story:** 1.3 - Project Initialization  
**Priority:** 🔴 Must  
**Estimate:** 1.5 hours  

### What is PersonaHub?
A CLI tool providing "Time Machine" style version control for AI agent configuration files (SOUL.md, MEMORY.md, etc.). Users can snapshot, browse history, and restore.

### Why this story?
The `init` command sets up PersonaHub in a directory. It creates the `.personahub/` folder, database, and config file. Without this, no other commands work.

---

## Dependencies

**Requires:** Story 1.2 (CLI Framework), Story 1.4 (SQLite Schema)  
**Blocks:** All snapshot operations (Epic 2)

---

## User Story

**As a** developer,  
**I want to** run `personahub init` in my workspace,  
**So that** PersonaHub starts tracking my persona files.

---

## Acceptance Criteria

### AC1: Fresh initialization
```gherkin
Given I am in a directory without .personahub/
When I run `personahub init`
Then a `.personahub/` directory is created
And `.personahub/history.db` (SQLite) is created
And `.personahub/config.json` is created
And `.personahub/snapshots/` directory is created
And I see "✓ PersonaHub initialized"
```

### AC2: Already initialized
```gherkin
Given .personahub/ already exists
When I run `personahub init`
Then I see error "PersonaHub already initialized"
And exit code is 1
And nothing is modified
```

### AC3: Force re-initialization
```gherkin
Given .personahub/ already exists
When I run `personahub init --force`
Then existing .personahub/ is backed up to .personahub.backup.<timestamp>/
And fresh initialization is performed
And I see "⚠ Re-initialized (backup: .personahub.backup.1708077600)"
```

### AC4: Shows tracked files preview
```gherkin
Given I run `personahub init`
When initialization completes
Then I see count of files that would be tracked
Example: "Found 5 files matching patterns (*.md, *.yaml, *.json)"
```

---

## Technical Implementation

### File Structure

```
src/
├── commands/
│   └── init.ts            # Update from stub
├── core/
│   ├── engine.ts          # Main PersonaHub engine
│   └── config.ts          # Config management
└── storage/
    ├── database.ts        # SQLite operations
    └── files.ts           # File operations
```

### Created Directory Structure

```
<workspace>/
├── .personahub/
│   ├── config.json        # Configuration
│   ├── history.db         # SQLite database
│   └── snapshots/         # Snapshot storage
└── (user's persona files)
```

### src/commands/init.ts

```typescript
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
        const result = engine.init();
        
        console.log(chalk.green('✓ PersonaHub initialized'));
        console.log(`  Found ${chalk.cyan(result.fileCount)} files matching patterns`);
        console.log(`  Config: ${chalk.dim('.personahub/config.json')}`);
        console.log(`\nRun ${chalk.cyan('personahub save')} to create your first snapshot`);
        
      } catch (error) {
        console.error(chalk.red('✗ Initialization failed:'), error.message);
        process.exit(1);
      }
    });
}
```

### src/core/engine.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { Database } from '../storage/database';
import { Config, DEFAULT_CONFIG, loadConfig, saveConfig } from './config';
import { getTrackedFiles } from '../storage/files';

export class PersonaHubEngine {
  private workDir: string;
  private personahubDir: string;
  private db: Database | null = null;
  private config: Config | null = null;

  constructor(workDir: string) {
    this.workDir = workDir;
    this.personahubDir = path.join(workDir, '.personahub');
  }

  isInitialized(): boolean {
    return fs.existsSync(this.personahubDir) && 
           fs.existsSync(path.join(this.personahubDir, 'history.db'));
  }

  init(): { fileCount: number } {
    // Create directories
    fs.mkdirSync(this.personahubDir, { recursive: true });
    fs.mkdirSync(path.join(this.personahubDir, 'snapshots'), { recursive: true });
    
    // Create config
    const configPath = path.join(this.personahubDir, 'config.json');
    saveConfig(configPath, DEFAULT_CONFIG);
    this.config = DEFAULT_CONFIG;
    
    // Initialize database
    const dbPath = path.join(this.personahubDir, 'history.db');
    this.db = new Database(dbPath);
    
    // Count tracked files
    const trackedFiles = getTrackedFiles(this.workDir, this.config);
    
    return { fileCount: trackedFiles.length };
  }

  ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error('PersonaHub not initialized. Run "personahub init" first.');
    }
  }
}
```

### src/core/config.ts

```typescript
import * as fs from 'fs';

export interface Config {
  version: number;
  include: string[];
  exclude: string[];
  snapshotDir: string;
}

export const DEFAULT_CONFIG: Config = {
  version: 1,
  include: ['*.md', '*.yaml', '*.yml', '*.json'],
  exclude: [
    '.personahub/**',
    'node_modules/**',
    '.git/**',
    '*.log',
    '.DS_Store'
  ],
  snapshotDir: '.personahub/snapshots'
};

export function loadConfig(configPath: string): Config {
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as Config;
}

export function saveConfig(configPath: string, config: Config): void {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
```

### src/storage/files.ts (partial)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Config } from '../core/config';

export interface TrackedFile {
  path: string;
  relativePath: string;
  size: number;
}

export function getTrackedFiles(workDir: string, config: Config): TrackedFile[] {
  const files: TrackedFile[] = [];
  
  for (const pattern of config.include) {
    const matches = glob.sync(pattern, {
      cwd: workDir,
      ignore: config.exclude,
      nodir: true
    });
    
    for (const match of matches) {
      const fullPath = path.join(workDir, match);
      const stat = fs.statSync(fullPath);
      files.push({
        path: fullPath,
        relativePath: match,
        size: stat.size
      });
    }
  }
  
  return files;
}
```

---

## Testing

### Manual Testing

```bash
# Test fresh init
mkdir /tmp/test-personahub && cd /tmp/test-personahub
echo "# Soul" > SOUL.md
echo "# Memory" > MEMORY.md
personahub init
# Should see: ✓ PersonaHub initialized, Found 2 files

# Verify structure
ls -la .personahub/
# Should see: config.json, history.db, snapshots/

# Test already initialized
personahub init
# Should see: ✗ PersonaHub already initialized

# Test force
personahub init --force
# Should see: ⚠ Backed up, ✓ PersonaHub initialized

# Cleanup
cd / && rm -rf /tmp/test-personahub
```

---

## Definition of Done

- [ ] src/core/engine.ts created with init() method
- [ ] src/core/config.ts created with DEFAULT_CONFIG
- [ ] src/storage/files.ts created with getTrackedFiles()
- [ ] src/commands/init.ts updated with real implementation
- [ ] `personahub init` creates .personahub/ structure
- [ ] `personahub init` on existing shows error
- [ ] `personahub init --force` backs up and re-initializes
- [ ] Output shows file count
- [ ] Code committed to git

---

## Notes for Implementing Agent

- Use `glob` package for pattern matching
- SQLite database creation is in Story 1.4
- For this story, database can be empty file or basic schema
- Handle Windows path separators (use path.join)
- Make sure .personahub is gitignored in user's repo
