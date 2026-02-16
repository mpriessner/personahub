import Database from 'better-sqlite3';

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
    this.integrityCheck();
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

  private integrityCheck(): void {
    const result = this.db.pragma('integrity_check') as { integrity_check: string }[];
    if (result[0]?.integrity_check !== 'ok') {
      throw new Error('Database integrity check failed');
    }
  }

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

  getSnapshots(limit?: number): SnapshotRow[] {
    let sql = 'SELECT * FROM snapshots ORDER BY created_at DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    return this.db.prepare(sql).all() as SnapshotRow[];
  }

  getSnapshotById(id: number): SnapshotRow | undefined {
    return this.db.prepare(
      'SELECT * FROM snapshots WHERE id = ?'
    ).get(id) as SnapshotRow | undefined;
  }

  getSnapshotByHash(hash: string): SnapshotRow | undefined {
    return this.db.prepare(
      'SELECT * FROM snapshots WHERE hash = ?'
    ).get(hash) as SnapshotRow | undefined;
  }

  getFilesForSnapshot(snapshotId: number): SnapshotFileRow[] {
    return this.db.prepare(
      'SELECT * FROM snapshot_files WHERE snapshot_id = ?'
    ).all(snapshotId) as SnapshotFileRow[];
  }

  getLatestSnapshot(): SnapshotRow | undefined {
    return this.db.prepare(
      'SELECT * FROM snapshots ORDER BY created_at DESC LIMIT 1'
    ).get() as SnapshotRow | undefined;
  }

  deleteSnapshot(id: number): void {
    this.db.prepare('DELETE FROM snapshots WHERE id = ?').run(id);
  }

  getSnapshotCount(): number {
    const result = this.db.prepare(
      'SELECT COUNT(*) as count FROM snapshots'
    ).get() as { count: number };
    return result.count;
  }

  close(): void {
    this.db.close();
  }
}
