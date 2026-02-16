import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createTempDir, cleanupTempDir, createTestFiles } from '../helpers/setup';

describe('PersonaHub Workflow', () => {
  let tempDir: string;
  let originalCwd: string;
  const CLI_PATH = path.join(__dirname, '..', '..', 'dist', 'cli.js');

  beforeAll(() => {
    // Build before running tests
    execSync('npm run build', { 
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe'
    });
  });

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = createTempDir();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  function run(cmd: string): string {
    try {
      return execSync(`node ${CLI_PATH} ${cmd}`, { 
        encoding: 'utf-8', 
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error: any) {
      // Return stderr for error cases
      if (error.stderr) {
        throw new Error(error.stderr);
      }
      throw error;
    }
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
      expect(listOut).toContain('#');
      expect(listOut).toContain('1');
      expect(listOut).toContain('2');

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

      // Verify backup referenced (may reuse existing snapshot if identical)
      expect(restoreOut).toContain('Backup created');
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

    test('--auto flag works', () => {
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

    test('saves multiple files', () => {
      createTestFiles(tempDir, { 
        'MEMORY.md': '# Memory',
        'config.yaml': 'key: value'
      });
      const out = run('save "multiple"');
      expect(out).toContain('3 files'); // SOUL.md + MEMORY.md + config.yaml
    });
  });

  describe('List Command', () => {
    test('empty state shows message', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      const out = run('list');
      expect(out).toContain('No snapshots');
    });

    test('shows snapshot details', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      run('save "Test snapshot"');
      
      const out = run('list');
      expect(out).toContain('#');
      expect(out).toContain('1');
      expect(out).toContain('Test snapshot');
    });

    test('--limit restricts output', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      for (let i = 1; i <= 5; i++) {
        fs.appendFileSync(path.join(tempDir, 'SOUL.md'), `\n${i}`);
        run(`save "Snapshot ${i}"`);
      }
      
      const out = run('list --limit 2');
      expect(out).toContain('5');
      expect(out).toContain('4');
      // Should not contain older snapshots
      const lines = out.split('\n').filter(l => l.includes('#'));
      expect(lines.length).toBeLessThanOrEqual(3); // Header + 2 snapshots
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

    test('shows removed files', () => {
      fs.unlinkSync(path.join(tempDir, 'SOUL.md'));
      const out = run('diff 1');
      expect(out).toContain('removed');
    });

    test('compares two snapshots', () => {
      fs.appendFileSync(path.join(tempDir, 'SOUL.md'), '\nline2');
      run('save "v2"');
      
      const out = run('diff 1 2');
      expect(out).toContain('modified');
    });

    test('--stat shows summary only', () => {
      fs.appendFileSync(path.join(tempDir, 'SOUL.md'), '\nline2');
      const out = run('diff 1 --stat');
      expect(out).toContain('modified');
      // Should not contain full diff output
      expect(out).not.toContain('+++');
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
      const restoreOut = run('restore 1 --force');
      // Verify backup was referenced (may reuse existing if identical)
      expect(restoreOut).toContain('Backup created');
    });

    test('handles nested directories', () => {
      // Start fresh for this test
      createTestFiles(tempDir, { 'memory/day1.md': 'content' });
      const saveOut = run('save "with nested"');
      // Extract the snapshot ID from output
      const match = saveOut.match(/#(\d+)/);
      const snapshotId = match ? match[1] : '3';
      
      fs.rmSync(path.join(tempDir, 'memory'), { recursive: true });
      
      run(`restore ${snapshotId} --force`);
      expect(fs.existsSync(path.join(tempDir, 'memory', 'day1.md'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('save fails when not initialized', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      expect(() => run('save')).toThrow();
    });

    test('list fails when not initialized', () => {
      expect(() => run('list')).toThrow();
    });

    test('restore fails for invalid ID', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      expect(() => run('restore 999 --force')).toThrow();
    });

    test('diff fails for invalid ID', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      expect(() => run('diff 999')).toThrow();
    });

    test('init with --force re-initializes', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      run('save "test"');
      
      // Force re-init
      const out = run('init --force');
      expect(out).toContain('initialized');
      
      // Old snapshots should be gone (in backup)
      const listOut = run('list');
      expect(listOut).toContain('No snapshots');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty files', () => {
      createTestFiles(tempDir, { 'empty.md': '' });
      run('init');
      const out = run('save "empty file"');
      expect(out).toContain('Snapshot created');
    });

    test('handles special characters in message', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      const out = run('save "Test with \\"quotes\\""');
      expect(out).toContain('Snapshot created');
    });

    test('handles unicode in files', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul 🎭\n- Be helpful 你好' });
      run('init');
      run('save "unicode"');
      
      // Modify and restore
      fs.writeFileSync(path.join(tempDir, 'SOUL.md'), 'changed');
      run('restore 1 --force');
      
      const content = fs.readFileSync(path.join(tempDir, 'SOUL.md'), 'utf-8');
      expect(content).toContain('🎭');
      expect(content).toContain('你好');
    });

    test('handles many snapshots', () => {
      createTestFiles(tempDir, { 'SOUL.md': '# Soul' });
      run('init');
      
      for (let i = 1; i <= 10; i++) {
        fs.appendFileSync(path.join(tempDir, 'SOUL.md'), `\n${i}`);
        run(`save "Snapshot ${i}"`);
      }
      
      const out = run('list');
      expect(out).toContain('10');
    });
  });
});
