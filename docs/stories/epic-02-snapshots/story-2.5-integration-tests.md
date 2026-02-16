# Story 2.5: Integration & E2E Tests

## Context

**Project:** PersonaHub  
**Epic:** E2 - Snapshot Operations  
**Story:** 2.5 - Integration Tests  
**Priority:** 🔴 Must  
**Estimate:** 3 hours  

---

## Dependencies

**Requires:** Stories 2.1-2.4  
**Blocks:** None

---

## User Story

**As a** developer,  
**I want** integration tests for snapshot operations,  
**So that** the full workflow is validated.

---

## Test Cases

### tests/integration/workflow.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createTempDir, cleanupTempDir, createTestFiles } from '../helpers/setup';

describe('PersonaHub Workflow', () => {
  let tempDir: string;
  const CLI = 'npx ts-node src/cli.ts';

  beforeEach(() => {
    tempDir = createTempDir();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir('/');
    cleanupTempDir(tempDir);
  });

  function run(cmd: string): string {
    return execSync(`${CLI} ${cmd}`, { encoding: 'utf-8', cwd: tempDir });
  }

  describe('Full Cycle', () => {
    test('init → save → modify → save → list → diff → restore', () => {
      // Create initial files
      createTestFiles(tempDir, {
        'SOUL.md': '# Soul\n- Be helpful',
        'MEMORY.md': '# Memory\n'
      });

      // Init
      const initOut = run('init');
      expect(initOut).toContain('initialized');
      expect(fs.existsSync(path.join(tempDir, '.personahub'))).toBe(true);

      // First save
      const save1Out = run('save "Initial"');
      expect(save1Out).toContain('Snapshot created');
      expect(save1Out).toContain('#1');

      // Modify
      fs.appendFileSync(path.join(tempDir, 'SOUL.md'), '\n- Be concise');
      
      // Second save
      const save2Out = run('save "Added concise"');
      expect(save2Out).toContain('#2');

      // List
      const listOut = run('list');
      expect(listOut).toContain('#1');
      expect(listOut).toContain('#2');
      expect(listOut).toContain('Initial');
      expect(listOut).toContain('Added concise');

      // Diff
      const diffOut = run('diff 1');
      expect(diffOut).toContain('modified');
      expect(diffOut).toContain('SOUL.md');

      // Restore
      const restoreOut = run('restore 1 --force');
      expect(restoreOut).toContain('Restored');
      
      // Verify restore
      const soul = fs.readFileSync(path.join(tempDir, 'SOUL.md'), 'utf-8');
      expect(soul).not.toContain('Be concise');

      // Verify backup created
      const finalList = run('list');
      expect(finalList).toContain('#3'); // Backup snapshot
    });
  });

  describe('Save Command', () => {
    beforeEach(() => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
    });

    test('creates snapshot directory', () => {
      run('save "test"');
      const snapshots = fs.readdirSync(path.join(tempDir, '.personahub', 'snapshots'));
      expect(snapshots.length).toBe(1);
    });

    test('--auto sets flag', () => {
      const out = run('save --auto');
      expect(out).toContain('Auto-snapshot');
    });

    test('--quiet suppresses output', () => {
      const out = run('save --quiet');
      expect(out.trim()).toBe('');
    });

    test('--skip-unchanged skips when no changes', () => {
      run('save "first"');
      const out = run('save --skip-unchanged');
      expect(out).toContain('No changes');
    });
  });

  describe('List Command', () => {
    test('empty state shows message', () => {
      run('init');
      const out = run('list');
      expect(out).toContain('No snapshots');
    });

    test('--limit restricts output', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      for (let i = 0; i < 5; i++) {
        fs.appendFileSync(path.join(tempDir, 'SOUL.md'), `\n${i}`);
        run(`save "Snapshot ${i}"`);
      }
      
      const out = run('list --limit 2');
      expect(out).toContain('#5');
      expect(out).toContain('#4');
      expect(out).not.toContain('#3');
    });
  });

  describe('Diff Command', () => {
    beforeEach(() => {
      createTestFiles(tempDir, { 'SOUL.md': 'line1' });
      run('init');
      run('save "v1"');
    });

    test('shows no diff when unchanged', () => {
      const out = run('diff 1');
      expect(out).toContain('No differences');
    });

    test('shows modified files', () => {
      fs.appendFileSync(path.join(tempDir, 'SOUL.md'), '\nline2');
      const out = run('diff 1');
      expect(out).toContain('modified');
      expect(out).toContain('SOUL.md');
    });

    test('shows added files', () => {
      createTestFiles(tempDir, { 'NEW.md': 'new content' });
      const out = run('diff 1');
      expect(out).toContain('added');
      expect(out).toContain('NEW.md');
    });

    test('compares two snapshots', () => {
      fs.appendFileSync(path.join(tempDir, 'SOUL.md'), '\nline2');
      run('save "v2"');
      
      const out = run('diff 1 2');
      expect(out).toContain('modified');
    });
  });

  describe('Restore Command', () => {
    beforeEach(() => {
      createTestFiles(tempDir, { 'SOUL.md': 'original' });
      run('init');
      run('save "original"');
      fs.writeFileSync(path.join(tempDir, 'SOUL.md'), 'modified');
      run('save "modified"');
    });

    test('restores files correctly', () => {
      run('restore 1 --force');
      const content = fs.readFileSync(path.join(tempDir, 'SOUL.md'), 'utf-8');
      expect(content).toBe('original');
    });

    test('creates backup snapshot', () => {
      run('restore 1 --force');
      const out = run('list');
      expect(out).toContain('#3'); // Backup
    });

    test('handles nested directories', () => {
      createTestFiles(tempDir, { 'memory/day1.md': 'content' });
      run('save "with nested"');
      fs.rmSync(path.join(tempDir, 'memory'), { recursive: true });
      
      run('restore 3 --force');
      expect(fs.existsSync(path.join(tempDir, 'memory/day1.md'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('commands fail when not initialized', () => {
      expect(() => run('save')).toThrow();
      expect(() => run('list')).toThrow();
    });

    test('restore fails for invalid ID', () => {
      run('init');
      expect(() => run('restore 999 --force')).toThrow();
    });

    test('diff fails for invalid ID', () => {
      run('init');
      expect(() => run('diff 999')).toThrow();
    });
  });
});
```

---

## Definition of Done

- [ ] Full cycle test passes
- [ ] Save tests pass
- [ ] List tests pass  
- [ ] Diff tests pass
- [ ] Restore tests pass
- [ ] Error handling tests pass
- [ ] `npm test` runs all tests
- [ ] Code committed to git
