# Story 1.6: Unit Tests - Core Storage

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E1 - Core CLI & Storage  
**Story:** 1.6 - Unit Tests  
**Priority:** 🔴 Must  
**Estimate:** 2 hours  

### Why this story?
Unit tests ensure core functionality works correctly and enable safe refactoring.

---

## Dependencies

**Requires:** Stories 1.3, 1.4, 1.5 (all core implementations)  
**Blocks:** None (can be done in parallel with Epic 2)

---

## User Story

**As a** developer,  
**I want** unit tests for core storage functionality,  
**So that** I can refactor with confidence.

---

## Acceptance Criteria

### AC1: Test suite runs
```gherkin
Given test files exist
When I run `npm test`
Then all tests execute
And results are reported
```

### AC2: Coverage targets met
```gherkin
Given all tests pass
When I check coverage
Then storage/database.ts ≥ 90%
And core/config.ts ≥ 90%
And storage/files.ts ≥ 80%
```

---

## Technical Implementation

### Setup Jest

**package.json additions:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli.ts',
    '!src/commands/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test File Structure

```
tests/
├── unit/
│   ├── database.test.ts
│   ├── config.test.ts
│   └── files.test.ts
└── helpers/
    └── setup.ts
```

### tests/helpers/setup.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'personahub-test-'));
}

export function cleanupTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function createTestFiles(dir: string, files: Record<string, string>): void {
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }
}
```

### tests/unit/database.test.ts

```typescript
import * as path from 'path';
import { DatabaseManager } from '../../src/storage/database';
import { createTempDir, cleanupTempDir } from '../helpers/setup';

describe('DatabaseManager', () => {
  let db: DatabaseManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    db = new DatabaseManager(path.join(tempDir, 'test.db'));
  });

  afterEach(() => {
    db.close();
    cleanupTempDir(tempDir);
  });

  describe('initialization', () => {
    test('creates database file', () => {
      expect(require('fs').existsSync(path.join(tempDir, 'test.db'))).toBe(true);
    });

    test('creates tables', () => {
      // Should not throw when querying
      const snapshots = db.getSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots).toHaveLength(0);
    });
  });

  describe('insertSnapshot', () => {
    test('returns new ID', () => {
      const id = db.insertSnapshot({
        hash: 'abc123',
        message: 'Test',
        file_count: 3,
        total_size: 1024
      });
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    test('increments ID', () => {
      const id1 = db.insertSnapshot({ hash: 'hash1', message: null, file_count: 1, total_size: 100 });
      const id2 = db.insertSnapshot({ hash: 'hash2', message: null, file_count: 1, total_size: 100 });
      expect(id2).toBe(id1 + 1);
    });

    test('stores all fields', () => {
      const id = db.insertSnapshot({
        hash: 'testhash',
        message: 'Test message',
        file_count: 5,
        total_size: 2048,
        is_auto: true,
        is_restore_backup: false
      });

      const snapshot = db.getSnapshotById(id);
      expect(snapshot).toBeDefined();
      expect(snapshot!.hash).toBe('testhash');
      expect(snapshot!.message).toBe('Test message');
      expect(snapshot!.file_count).toBe(5);
      expect(snapshot!.total_size).toBe(2048);
      expect(snapshot!.is_auto).toBe(1);
      expect(snapshot!.is_restore_backup).toBe(0);
    });

    test('rejects duplicate hash', () => {
      db.insertSnapshot({ hash: 'unique', message: null, file_count: 1, total_size: 100 });
      expect(() => {
        db.insertSnapshot({ hash: 'unique', message: null, file_count: 1, total_size: 100 });
      }).toThrow();
    });
  });

  describe('getSnapshots', () => {
    test('returns empty array when no snapshots', () => {
      expect(db.getSnapshots()).toEqual([]);
    });

    test('returns snapshots newest first', () => {
      db.insertSnapshot({ hash: 'first', message: 'First', file_count: 1, total_size: 100 });
      // Small delay to ensure different timestamps
      db.insertSnapshot({ hash: 'second', message: 'Second', file_count: 1, total_size: 100 });

      const snapshots = db.getSnapshots();
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].hash).toBe('second');
      expect(snapshots[1].hash).toBe('first');
    });

    test('respects limit', () => {
      for (let i = 0; i < 5; i++) {
        db.insertSnapshot({ hash: `hash${i}`, message: null, file_count: 1, total_size: 100 });
      }

      const limited = db.getSnapshots(3);
      expect(limited).toHaveLength(3);
    });
  });

  describe('insertFiles', () => {
    test('inserts files for snapshot', () => {
      const snapshotId = db.insertSnapshot({
        hash: 'snap1',
        message: null,
        file_count: 2,
        total_size: 512
      });

      db.insertFiles(snapshotId, [
        { path: 'SOUL.md', hash: 'filehash1', size: 256 },
        { path: 'MEMORY.md', hash: 'filehash2', size: 256 }
      ]);

      const files = db.getFilesForSnapshot(snapshotId);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('SOUL.md');
    });

    test('bulk insert is atomic', () => {
      const snapshotId = db.insertSnapshot({
        hash: 'snap2',
        message: null,
        file_count: 100,
        total_size: 10000
      });

      const files = Array.from({ length: 100 }, (_, i) => ({
        path: `file${i}.md`,
        hash: `hash${i}`,
        size: 100
      }));

      db.insertFiles(snapshotId, files);

      const retrieved = db.getFilesForSnapshot(snapshotId);
      expect(retrieved).toHaveLength(100);
    });
  });

  describe('deleteSnapshot', () => {
    test('removes snapshot', () => {
      const id = db.insertSnapshot({ hash: 'todelete', message: null, file_count: 1, total_size: 100 });
      db.deleteSnapshot(id);
      expect(db.getSnapshotById(id)).toBeUndefined();
    });

    test('cascades to files', () => {
      const id = db.insertSnapshot({ hash: 'withfiles', message: null, file_count: 1, total_size: 100 });
      db.insertFiles(id, [{ path: 'test.md', hash: 'fhash', size: 100 }]);

      db.deleteSnapshot(id);

      expect(db.getFilesForSnapshot(id)).toHaveLength(0);
    });
  });

  describe('getLatestSnapshot', () => {
    test('returns undefined when empty', () => {
      expect(db.getLatestSnapshot()).toBeUndefined();
    });

    test('returns most recent', () => {
      db.insertSnapshot({ hash: 'old', message: 'Old', file_count: 1, total_size: 100 });
      db.insertSnapshot({ hash: 'new', message: 'New', file_count: 1, total_size: 100 });

      const latest = db.getLatestSnapshot();
      expect(latest?.hash).toBe('new');
    });
  });
});
```

### tests/unit/config.test.ts

```typescript
import * as path from 'path';
import * as fs from 'fs';
import { 
  loadConfig, 
  saveConfig, 
  validateConfig, 
  DEFAULT_CONFIG,
  Config 
} from '../../src/core/config';
import { createTempDir, cleanupTempDir } from '../helpers/setup';

describe('Config', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('DEFAULT_CONFIG', () => {
    test('has required fields', () => {
      expect(DEFAULT_CONFIG.version).toBe(1);
      expect(Array.isArray(DEFAULT_CONFIG.include)).toBe(true);
      expect(Array.isArray(DEFAULT_CONFIG.exclude)).toBe(true);
      expect(typeof DEFAULT_CONFIG.snapshotDir).toBe('string');
    });

    test('includes common persona patterns', () => {
      expect(DEFAULT_CONFIG.include).toContain('*.md');
      expect(DEFAULT_CONFIG.include).toContain('*.yaml');
    });

    test('excludes .personahub', () => {
      expect(DEFAULT_CONFIG.exclude.some(p => p.includes('.personahub'))).toBe(true);
    });
  });

  describe('saveConfig', () => {
    test('creates file', () => {
      const configPath = path.join(tempDir, 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('writes valid JSON', () => {
      const configPath = path.join(tempDir, 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('creates parent directories', () => {
      const configPath = path.join(tempDir, 'deep', 'nested', 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      expect(fs.existsSync(configPath)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    test('reads saved config', () => {
      const configPath = path.join(tempDir, 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      
      const loaded = loadConfig(configPath);
      expect(loaded.version).toBe(DEFAULT_CONFIG.version);
      expect(loaded.include).toEqual(DEFAULT_CONFIG.include);
    });

    test('throws on missing file', () => {
      expect(() => {
        loadConfig(path.join(tempDir, 'nonexistent.json'));
      }).toThrow(/not found/);
    });

    test('throws on invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, 'not valid json');
      
      expect(() => loadConfig(configPath)).toThrow(/Invalid JSON/);
    });
  });

  describe('validateConfig', () => {
    test('accepts valid config', () => {
      expect(() => validateConfig(DEFAULT_CONFIG)).not.toThrow();
    });

    test('rejects missing version', () => {
      const invalid = { ...DEFAULT_CONFIG, version: undefined } as any;
      expect(() => validateConfig(invalid)).toThrow(/version/);
    });

    test('rejects non-array include', () => {
      const invalid = { ...DEFAULT_CONFIG, include: 'not-array' } as any;
      expect(() => validateConfig(invalid)).toThrow(/include.*array/);
    });

    test('adds .personahub to exclude if missing', () => {
      const config: Config = {
        version: 1,
        include: ['*.md'],
        exclude: [],
        snapshotDir: '.personahub/snapshots'
      };
      
      validateConfig(config);
      expect(config.exclude.some(p => p.includes('.personahub'))).toBe(true);
    });
  });
});
```

### tests/unit/files.test.ts

```typescript
import * as path from 'path';
import { getTrackedFiles, hashFile, hashContent } from '../../src/storage/files';
import { DEFAULT_CONFIG } from '../../src/core/config';
import { createTempDir, cleanupTempDir, createTestFiles } from '../helpers/setup';

describe('Files', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('hashFile', () => {
    test('returns consistent hash', () => {
      createTestFiles(tempDir, { 'test.md': 'hello world' });
      const filePath = path.join(tempDir, 'test.md');
      
      const hash1 = hashFile(filePath);
      const hash2 = hashFile(filePath);
      
      expect(hash1).toBe(hash2);
    });

    test('returns different hash for different content', () => {
      createTestFiles(tempDir, { 
        'a.md': 'content a',
        'b.md': 'content b'
      });
      
      const hashA = hashFile(path.join(tempDir, 'a.md'));
      const hashB = hashFile(path.join(tempDir, 'b.md'));
      
      expect(hashA).not.toBe(hashB);
    });

    test('returns 12 character hash', () => {
      createTestFiles(tempDir, { 'test.md': 'content' });
      const hash = hashFile(path.join(tempDir, 'test.md'));
      expect(hash).toHaveLength(12);
    });
  });

  describe('hashContent', () => {
    test('hashes string', () => {
      const hash = hashContent('hello');
      expect(hash).toHaveLength(12);
    });

    test('hashes buffer', () => {
      const hash = hashContent(Buffer.from('hello'));
      expect(hash).toHaveLength(12);
    });

    test('matches hashFile for same content', () => {
      const content = 'test content';
      createTestFiles(tempDir, { 'test.md': content });
      
      const fileHash = hashFile(path.join(tempDir, 'test.md'));
      const contentHash = hashContent(content);
      
      expect(fileHash).toBe(contentHash);
    });
  });

  describe('getTrackedFiles', () => {
    test('returns empty for empty directory', () => {
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files).toHaveLength(0);
    });

    test('finds markdown files', () => {
      createTestFiles(tempDir, {
        'SOUL.md': '# Soul',
        'MEMORY.md': '# Memory'
      });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files).toHaveLength(2);
    });

    test('excludes non-matching files', () => {
      createTestFiles(tempDir, {
        'SOUL.md': '# Soul',
        'app.js': 'console.log("hi")'
      });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files).toHaveLength(1);
      expect(files[0].relativePath).toBe('SOUL.md');
    });

    test('respects exclude patterns', () => {
      createTestFiles(tempDir, {
        'SOUL.md': '# Soul',
        'node_modules/pkg/file.md': '# Package'
      });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files).toHaveLength(1);
    });

    test('returns sorted files', () => {
      createTestFiles(tempDir, {
        'z.md': 'z',
        'a.md': 'a',
        'm.md': 'm'
      });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files.map(f => f.relativePath)).toEqual(['a.md', 'm.md', 'z.md']);
    });

    test('includes file size and hash', () => {
      createTestFiles(tempDir, { 'test.md': 'content' });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files[0].size).toBeGreaterThan(0);
      expect(files[0].hash).toHaveLength(12);
    });
  });
});
```

---

## Definition of Done

- [ ] Jest configured with ts-jest
- [ ] tests/helpers/setup.ts created
- [ ] tests/unit/database.test.ts - all tests pass
- [ ] tests/unit/config.test.ts - all tests pass
- [ ] tests/unit/files.test.ts - all tests pass
- [ ] `npm test` runs successfully
- [ ] Coverage ≥ 80% for core modules
- [ ] Code committed to git

---

## Notes for Implementing Agent

- Use Jest with ts-jest preset
- Create temp directories for test isolation
- Clean up after each test
- Test both success and error cases
- Use transactions for database tests
