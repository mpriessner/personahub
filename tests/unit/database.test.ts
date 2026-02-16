import * as path from 'path';
import * as fs from 'fs';
import { DatabaseManager } from '../../src/storage/database';
import { createTempDir, cleanupTempDir } from '../helpers/setup';

describe('DatabaseManager', () => {
  let db: DatabaseManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempDir();
    db = new DatabaseManager(path.join(tempDir, 'test.db'));
    await db.ready();
  });

  afterEach(() => {
    db.close();
    cleanupTempDir(tempDir);
  });

  describe('initialization', () => {
    test('creates database file', () => {
      expect(fs.existsSync(path.join(tempDir, 'test.db'))).toBe(true);
    });

    test('creates tables', () => {
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

    test('bulk insert works', () => {
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

  describe('getSnapshotCount', () => {
    test('returns 0 when empty', () => {
      expect(db.getSnapshotCount()).toBe(0);
    });

    test('returns correct count', () => {
      db.insertSnapshot({ hash: 'h1', message: null, file_count: 1, total_size: 100 });
      db.insertSnapshot({ hash: 'h2', message: null, file_count: 1, total_size: 100 });
      db.insertSnapshot({ hash: 'h3', message: null, file_count: 1, total_size: 100 });
      expect(db.getSnapshotCount()).toBe(3);
    });
  });
});
