# Story 1.5: Config Management

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E1 - Core CLI & Storage  
**Story:** 1.5 - Config Management  
**Priority:** 🔴 Must  
**Estimate:** 1 hour  

### Why this story?
Users need to configure which files PersonaHub tracks. The config file defines include/exclude patterns.

---

## Dependencies

**Requires:** Story 1.3 (Project Init)  
**Blocks:** Story 2.1 (Save - needs to know which files to track)

---

## User Story

**As a** developer,  
**I want to** configure which files PersonaHub tracks,  
**So that** I can include/exclude specific file patterns.

---

## Acceptance Criteria

### AC1: Default config created on init
```gherkin
Given I run `personahub init`
When initialization completes
Then `.personahub/config.json` exists with defaults
```

### AC2: Default patterns are sensible
```gherkin
Given default config
Then include patterns contain: *.md, *.yaml, *.yml, *.json
And exclude patterns contain: .personahub/**, node_modules/**, .git/**
```

### AC3: Config is respected by save
```gherkin
Given I modify config to exclude "SECRET.md"
When I run `personahub save`
Then SECRET.md is not included in snapshot
```

### AC4: Invalid config shows error
```gherkin
Given config.json has invalid JSON
When I run `personahub save`
Then I see error "Invalid config: <details>"
And command exits with code 1
```

---

## Technical Implementation

### Default Config

```json
{
  "version": 1,
  "include": [
    "*.md",
    "*.yaml", 
    "*.yml",
    "*.json",
    "*.txt"
  ],
  "exclude": [
    ".personahub/**",
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    "package-lock.json",
    "yarn.lock"
  ],
  "snapshotDir": ".personahub/snapshots"
}
```

### src/core/config.ts (Complete)

```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  version: number;
  include: string[];
  exclude: string[];
  snapshotDir: string;
}

export const DEFAULT_CONFIG: Config = {
  version: 1,
  include: ['*.md', '*.yaml', '*.yml', '*.json', '*.txt'],
  exclude: [
    '.personahub/**',
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'package-lock.json',
    'yarn.lock'
  ],
  snapshotDir: '.personahub/snapshots'
};

export function loadConfig(configPath: string): Config {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  try {
    const config = JSON.parse(content) as Config;
    validateConfig(config);
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config: ${error.message}`);
    }
    throw error;
  }
}

export function saveConfig(configPath: string, config: Config): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

export function validateConfig(config: Config): void {
  if (typeof config.version !== 'number') {
    throw new Error('Config missing or invalid "version" field');
  }
  
  if (!Array.isArray(config.include)) {
    throw new Error('Config "include" must be an array');
  }
  
  if (!Array.isArray(config.exclude)) {
    throw new Error('Config "exclude" must be an array');
  }
  
  if (typeof config.snapshotDir !== 'string') {
    throw new Error('Config "snapshotDir" must be a string');
  }
  
  // Ensure .personahub is always excluded (safety)
  if (!config.exclude.some(p => p.includes('.personahub'))) {
    config.exclude.push('.personahub/**');
  }
}

export function getConfigPath(workDir: string): string {
  return path.join(workDir, '.personahub', 'config.json');
}

export function mergeWithDefaults(partial: Partial<Config>): Config {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    include: partial.include || DEFAULT_CONFIG.include,
    exclude: partial.exclude || DEFAULT_CONFIG.exclude
  };
}
```

### src/storage/files.ts (Update)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';
import { Config } from '../core/config';

export interface TrackedFile {
  path: string;           // Absolute path
  relativePath: string;   // Relative to workDir
  size: number;
  hash: string;
}

export function getTrackedFiles(workDir: string, config: Config): TrackedFile[] {
  const files: TrackedFile[] = [];
  const seen = new Set<string>();
  
  for (const pattern of config.include) {
    const matches = glob.sync(pattern, {
      cwd: workDir,
      ignore: config.exclude,
      nodir: true,
      dot: false  // Don't match dotfiles unless explicit
    });
    
    for (const match of matches) {
      // Avoid duplicates if multiple patterns match same file
      if (seen.has(match)) continue;
      seen.add(match);
      
      const fullPath = path.join(workDir, match);
      
      // Skip if file doesn't exist (race condition) or is directory
      if (!fs.existsSync(fullPath)) continue;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) continue;
      
      const hash = hashFile(fullPath);
      
      files.push({
        path: fullPath,
        relativePath: match,
        size: stat.size,
        hash
      });
    }
  }
  
  // Sort for consistent ordering
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  
  return files;
}

export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

export function hashContent(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}
```

---

## Testing

### Manual Testing

```bash
cd /tmp/test-personahub
personahub init

# Check default config
cat .personahub/config.json

# Create test files
echo "# Soul" > SOUL.md
echo "# Secret" > SECRET.md
echo "console.log('hi')" > app.js

# Test default (should track .md only)
personahub save "test"
# Should see: 2 files (SOUL.md, SECRET.md - both .md)

# Modify config to exclude SECRET.md
# Edit .personahub/config.json, add "SECRET.md" to exclude
personahub save "after exclude"
# Should see: 1 file (SOUL.md only)

# Test invalid JSON
echo "invalid" > .personahub/config.json
personahub save
# Should see: Error: Invalid JSON in config
```

---

## Definition of Done

- [ ] Config interface defined with all fields
- [ ] DEFAULT_CONFIG has sensible patterns
- [ ] loadConfig() reads and parses JSON
- [ ] saveConfig() writes formatted JSON
- [ ] validateConfig() checks required fields
- [ ] .personahub always excluded (safety)
- [ ] getTrackedFiles() respects include/exclude
- [ ] Files sorted consistently
- [ ] Invalid config shows clear error
- [ ] Code committed to git

---

## Notes for Implementing Agent

- Use glob package with ignore option
- Hash files with SHA-256, truncate to 12 chars for readability
- Sort files for deterministic snapshots
- Always force-exclude .personahub to prevent recursion
