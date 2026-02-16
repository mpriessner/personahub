import * as path from 'path';
import * as fs from 'fs';
import { 
  getTrackedFiles, 
  hashFile, 
  hashContent, 
  validatePath,
  copyFileSafe,
  isBinaryFile
} from '../../src/storage/files';
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

    test('returns 16 character hash', () => {
      createTestFiles(tempDir, { 'test.md': 'content' });
      const hash = hashFile(path.join(tempDir, 'test.md'));
      expect(hash).toHaveLength(16);
    });
  });

  describe('hashContent', () => {
    test('hashes string', () => {
      const hash = hashContent('hello');
      expect(hash).toHaveLength(16);
    });

    test('hashes buffer', () => {
      const hash = hashContent(Buffer.from('hello'));
      expect(hash).toHaveLength(16);
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
      expect(files[0].hash).toHaveLength(16);
    });

    test('finds yaml files', () => {
      createTestFiles(tempDir, {
        'config.yaml': 'key: value',
        'other.yml': 'another: value'
      });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files).toHaveLength(2);
    });

    test('finds json files', () => {
      createTestFiles(tempDir, {
        'data.json': '{"key": "value"}'
      });
      
      const files = getTrackedFiles(tempDir, DEFAULT_CONFIG);
      expect(files).toHaveLength(1);
    });
  });

  describe('validatePath', () => {
    test('accepts valid relative path', () => {
      const result = validatePath(tempDir, 'subdir/file.md');
      expect(result).toBe(path.join(tempDir, 'subdir/file.md'));
    });

    test('accepts nested path', () => {
      const result = validatePath(tempDir, 'a/b/c/file.md');
      expect(result).toBe(path.join(tempDir, 'a/b/c/file.md'));
    });

    test('rejects path traversal with ../', () => {
      expect(() => {
        validatePath(tempDir, '../outside.md');
      }).toThrow(/path traversal/);
    });

    test('rejects hidden path traversal', () => {
      expect(() => {
        validatePath(tempDir, 'a/../../outside.md');
      }).toThrow(/path traversal/);
    });

    test('rejects absolute path outside base', () => {
      expect(() => {
        validatePath(tempDir, '/etc/passwd');
      }).toThrow(/path traversal/);
    });
  });

  describe('copyFileSafe', () => {
    test('copies file to existing directory', () => {
      createTestFiles(tempDir, { 'source.md': 'content' });
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'dest.md');
      
      copyFileSafe(src, dest);
      
      expect(fs.existsSync(dest)).toBe(true);
      expect(fs.readFileSync(dest, 'utf-8')).toBe('content');
    });

    test('creates parent directories', () => {
      createTestFiles(tempDir, { 'source.md': 'content' });
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'deep/nested/dir/dest.md');
      
      copyFileSafe(src, dest);
      
      expect(fs.existsSync(dest)).toBe(true);
    });
  });

  describe('isBinaryFile', () => {
    test('returns false for text file', () => {
      createTestFiles(tempDir, { 'text.md': 'Hello, world!' });
      expect(isBinaryFile(path.join(tempDir, 'text.md'))).toBe(false);
    });

    test('returns true for file with null bytes', () => {
      const filePath = path.join(tempDir, 'binary.bin');
      fs.writeFileSync(filePath, Buffer.from([0x48, 0x00, 0x65, 0x6c, 0x6c, 0x6f]));
      expect(isBinaryFile(filePath)).toBe(true);
    });
  });
});
