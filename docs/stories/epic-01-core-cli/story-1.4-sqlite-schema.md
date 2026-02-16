# Story 1.4: SQLite Schema Design

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E1 - Core CLI & Storage  
**Story:** 1.4 - SQLite Schema Design  
**Priority:** 🔴 Must  
**Estimate:** 1 hour  

### What is PersonaHub?
A CLI tool providing "Time Machine" style version control for AI agent configuration files.

### Why this story?
The SQLite database stores all snapshot metadata. Without it, we can't track history, compare versions, or know what to restore.

---

## Dependencies

**Requires:** Story 1.1 (NPM Package Setup)  
**Blocks:** Stories 2.1 (Save), 2.2 (List), 2.3 (Diff), 2.4 (Restore)

---

## User Story

**As a** system,  
**I need** a database schema to store version history,  
**So that** snapshots can be queried and managed efficiently.

---

## Acceptance Criteria

### AC1: Database created on init
```gherkin
Given PersonaHub init runs
When database is created
Then file `.personahub/history.db` exists
And it is a valid SQLite database
```

### AC2: Tables exist
```gherkin
Given database is initialized
When I query the schema
Then these tables exist:
  - snapshots
  - snapshot_files
And appropriate indexes exist
```

### AC3: CRUD operations work
```gherkin
Given database is initialized
When I insert a snapshot
Then I can retrieve it by ID
And I can list all snapshots
And I can delete old snapshots
```

---

## Technical Implementation

### Schema Design

```sql
-- Snapshots table: stores each version
CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_count INTEGER NOT NULL,
    total_size INTEGER NOT NULL,
    is_auto INTEGER DEFAULT 0,
    is_restore_backup INTEGER DEFAULT 0
);

-- Files in each snapshot
CREATE TABLE IF NOT EXISTS snapshot_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    hash TEXT NOT NULL,
    size INTEGER NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at 
    ON snapshots(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_files_snapshot_id 
    ON snapshot_files(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_hash 
    ON snapshots(hash);
```

### src/storage/database.ts

```typescript
import Database from 'better-sqlite3';
import * as path from 'path';

export interface SnapshotRow {
  id: number;
  hash: string;
  message: string | null;
  created_at: string;
  file_count: number;
  total_size: number;
  is_auto: number;
  is_restore_backup: number;
}

export interface SnapshotFileRow {
  id: number;
  snapshot_id: number;
  path: string;
  hash: string;
  size: number;
}

export interface SnapshotInsert {
  hash: string;
  message: string | null;
  file_count: number;
  total_size: number;
  is_auto?: boolean;
  is_restore_backup?: boolean;
}

export interface FileInsert {
  path: string;
  hash: string;
  size: number;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    const schema = `
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE NOT NULL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_count INTEGER NOT NULL,
        total_size INTEGER NOT NULL,
        is_auto INTEGER DEFAULT 0,
        is_restore_backup INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS snapshot_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER NOT NULL,
        path TEXT NOT NULL,
        hash TEXT NOT NULL,
        size INTEGER NOT NULL,
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_snapshots_created_at 
        ON snapshots(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_snapshot_files_snapshot_id 
        ON snapshot_files(snapshot_id);
      
      CREATE INDEX IF NOT EXISTS idx_snapshots_hash 
        ON snapshots(hash);
    `;
    
    this.db.exec(schema);
  }

  // Insert a new snapshot, returns the ID
  insertSnapshot(data: SnapshotInsert): number {
    const stmt = this.db.prepare(`
      INSERT INTO snapshots (hash, message, file_count, total_size, is_auto, is_restore_backup)
      VALUES (@hash, @message, @file_count, @total_size, @is_auto, @is_restore_backup)
    `);
    
    const result = stmt.run({
      hash: data.hash,
      message: data.message,
      file_count: data.file_count,
      total_size: data.total_size,
      is_auto: data.is_auto ? 1 : 0,
      is_restore_backup: data.is_restore_backup ? 1 : 0
    });
    
    return result.lastInsertRowid as number;
  }

  // Insert files for a snapshot
  insertFiles(snapshotId: number, files: FileInsert[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO snapshot_files (snapshot_id, path, hash, size)
      VALUES (@snapshot_id, @path, @hash, @size)
    `);
    
    const insertMany = this.db.transaction((files: FileInsert[]) => {
      for (const file of files) {
        stmt.run({
          snapshot_id: snapshotId,
          path: file.path,
          hash: file.hash,
          size: file.size
        });
      }
    });
    
    insertMany(files);
  }

  // Get all snapshots, newest first
  getSnapshots(limit?: number): SnapshotRow[] {
    let sql = 'SELECT * FROM snapshots ORDER BY created_at DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    return this.db.prepare(sql).all() as SnapshotRow[];
  }

  // Get snapshot by ID
  getSnapshotById(id: number): SnapshotRow | undefined {
    return this.db.prepare(
      'SELECT * FROM snapshots WHERE id = ?'
    ).get(id) as SnapshotRow | undefined;
  }

  // Get snapshot by hash
  getSnapshotByHash(hash: string): SnapshotRow | undefined {
    return this.db.prepare(
      'SELECT * FROM snapshots WHERE hash = ?'
    ).get(hash) as SnapshotRow | undefined;
  }

  // Get files for a snapshot
  getFilesForSnapshot(snapshotId: number): SnapshotFileRow[] {
    return this.db.prepare(
      'SELECT * FROM snapshot_files WHERE snapshot_id = ?'
    ).all(snapshotId) as SnapshotFileRow[];
  }

  // Get the latest snapshot
  getLatestSnapshot(): SnapshotRow | undefined {
    return this.db.prepare(
      'SELECT * FROM snapshots ORDER BY created_at DESC LIMIT 1'
    ).get() as SnapshotRow | undefined;
  }

  // Delete a snapshot and its files
  deleteSnapshot(id: number): void {
    this.db.prepare('DELETE FROM snapshots WHERE id = ?').run(id);
    // Files deleted automatically via CASCADE
  }

  // Get snapshot count
  getSnapshotCount(): number {
    const result = this.db.prepare(
      'SELECT COUNT(*) as count FROM snapshots'
    ).get() as { count: number };
    return result.count;
  }

  // Close database connection
  close(): void {
    this.db.close();
  }
}
```

---

## Testing

### Manual Testing

```bash
# After init, check database
cd /tmp/test-personahub
personahub init
sqlite3 .personahub/history.db ".tables"
# Should show: snapshot_files  snapshots

sqlite3 .personahub/history.db ".schema snapshots"
# Should show table schema

sqlite3 .personahub/history.db "SELECT * FROM snapshots"
# Should be empty initially
```

### Unit Tests (Story 1.6)

```typescript
describe('DatabaseManager', () => {
  let db: DatabaseManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'personahub-test-'));
    db = new DatabaseManager(path.join(tempDir, 'test.db'));
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true });
  });

  test('creates tables on init', () => {
    // Tables should exist after construction
    const snapshots = db.getSnapshots();
    expect(Array.isArray(snapshots)).toBe(true);
  });

  test('inserts and retrieves snapshot', () => {
    const id = db.insertSnapshot({
      hash: 'abc123',
      message: 'Test snapshot',
      file_count: 3,
      total_size: 1024
    });
    
    const snapshot = db.getSnapshotById(id);
    expect(snapshot).toBeDefined();
    expect(snapshot?.hash).toBe('abc123');
    expect(snapshot?.message).toBe('Test snapshot');
  });

  test('inserts and retrieves files', () => {
    const snapshotId = db.insertSnapshot({
      hash: 'abc123',
      message: null,
      file_count: 2,
      total_size: 512
    });
    
    db.insertFiles(snapshotId, [
      { path: 'SOUL.md', hash: 'file1hash', size: 256 },
      { path: 'MEMORY.md', hash: 'file2hash', size: 256 }
    ]);
    
    const files = db.getFilesForSnapshot(snapshotId);
    expect(files).toHaveLength(2);
  });

  test('lists snapshots newest first', () => {
    db.insertSnapshot({ hash: 'first', message: null, file_count: 1, total_size: 100 });
    db.insertSnapshot({ hash: 'second', message: null, file_count: 1, total_size: 100 });
    
    const snapshots = db.getSnapshots();
    expect(snapshots[0].hash).toBe('second');
  });

  test('deletes snapshot cascades to files', () => {
    const id = db.insertSnapshot({ hash: 'todelete', message: null, file_count: 1, total_size: 100 });
    db.insertFiles(id, [{ path: 'test.md', hash: 'filehash', size: 100 }]);
    
    db.deleteSnapshot(id);
    
    expect(db.getSnapshotById(id)).toBeUndefined();
    expect(db.getFilesForSnapshot(id)).toHaveLength(0);
  });
});
```

---

## Definition of Done

- [ ] src/storage/database.ts created
- [ ] All interfaces defined (SnapshotRow, FileRow, etc.)
- [ ] DatabaseManager class implemented
- [ ] Schema migration runs on construction
- [ ] insertSnapshot() works
- [ ] insertFiles() works with transaction
- [ ] getSnapshots() returns newest first
- [ ] getSnapshotById() works
- [ ] deleteSnapshot() cascades to files
- [ ] Code committed to git

---

## Notes for Implementing Agent

- Use `better-sqlite3` (synchronous, fast)
- Enable WAL mode for better concurrent reads
- Enable foreign keys for cascade delete
- Use transactions for bulk inserts
- All operations are synchronous (no async/await needed)
- **⚠️ Add `PRAGMA integrity_check` on database open** (health check)
- Consider adding a `personahub doctor` command for diagnostics

## Review Fixes Applied
- ✅ Add integrity check on startup
- ✅ Document network drive limitations
