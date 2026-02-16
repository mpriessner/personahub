import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'fs';
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
  private db!: SqlJsDatabase;
  private dbPath: string;
  private initialized: Promise<void>;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.initialized = this.init();
  }

  private async init(): Promise<void> {
    const SQL = await initSqlJs();
    
    // Load existing database or create new
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    
    this.migrate();
    this.integrityCheck();
  }

  async ready(): Promise<void> {
    await this.initialized;
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
    
    this.db.run(schema);
    this.save(); // Save after migration
  }

  private integrityCheck(): void {
    const result = this.db.exec('PRAGMA integrity_check');
    if (result.length > 0 && result[0].values[0][0] !== 'ok') {
      throw new Error('Database integrity check failed');
    }
  }

  private save(): void {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, buffer);
  }

  insertSnapshot(data: SnapshotInsert): number {
    this.db.run(`
      INSERT INTO snapshots (hash, message, file_count, total_size, is_auto, is_restore_backup)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.hash,
      data.message,
      data.file_count,
      data.total_size,
      data.is_auto ? 1 : 0,
      data.is_restore_backup ? 1 : 0
    ]);
    
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0] as number;
    this.save();
    return id;
  }

  insertFiles(snapshotId: number, files: FileInsert[]): void {
    for (const file of files) {
      this.db.run(`
        INSERT INTO snapshot_files (snapshot_id, path, hash, size)
        VALUES (?, ?, ?, ?)
      `, [snapshotId, file.path, file.hash, file.size]);
    }
    this.save();
  }

  private rowsToObjects<T>(result: any[]): T[] {
    if (result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as T;
    });
  }

  getSnapshots(limit?: number): SnapshotRow[] {
    let sql = 'SELECT * FROM snapshots ORDER BY created_at DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    const result = this.db.exec(sql);
    return this.rowsToObjects<SnapshotRow>(result);
  }

  getSnapshotById(id: number): SnapshotRow | undefined {
    const result = this.db.exec('SELECT * FROM snapshots WHERE id = ?', [id]);
    const rows = this.rowsToObjects<SnapshotRow>(result);
    return rows[0];
  }

  getSnapshotByHash(hash: string): SnapshotRow | undefined {
    const result = this.db.exec('SELECT * FROM snapshots WHERE hash = ?', [hash]);
    const rows = this.rowsToObjects<SnapshotRow>(result);
    return rows[0];
  }

  getFilesForSnapshot(snapshotId: number): SnapshotFileRow[] {
    const result = this.db.exec('SELECT * FROM snapshot_files WHERE snapshot_id = ?', [snapshotId]);
    return this.rowsToObjects<SnapshotFileRow>(result);
  }

  getLatestSnapshot(): SnapshotRow | undefined {
    const result = this.db.exec('SELECT * FROM snapshots ORDER BY created_at DESC LIMIT 1');
    const rows = this.rowsToObjects<SnapshotRow>(result);
    return rows[0];
  }

  deleteSnapshot(id: number): void {
    this.db.run('DELETE FROM snapshots WHERE id = ?', [id]);
    this.save();
  }

  getSnapshotCount(): number {
    const result = this.db.exec('SELECT COUNT(*) as count FROM snapshots');
    if (result.length === 0) return 0;
    return result[0].values[0][0] as number;
  }

  close(): void {
    this.save();
    this.db.close();
  }
}
