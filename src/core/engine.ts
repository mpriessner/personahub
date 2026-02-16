import * as fs from 'fs';
import * as path from 'path';
import * as Diff from 'diff';
import { DatabaseManager } from '../storage/database';
import { loadConfig, saveConfig, getConfigPath, DEFAULT_CONFIG, Config } from './config';
import { getTrackedFiles, hashContent, validatePath, copyFileSafe } from '../storage/files';
import {
  Snapshot,
  CreateSnapshotOptions,
  CreateSnapshotResult,
  RestorePreview,
  RestoreResult,
  DiffResult,
  ModifiedFile,
  TrackedFile
} from './types';

export class PersonaHubEngine {
  private workDir: string;
  private personahubDir: string;
  private db: DatabaseManager | null = null;
  private config: Config | null = null;

  constructor(workDir: string) {
    this.workDir = workDir;
    this.personahubDir = path.join(workDir, '.personahub');
  }

  isInitialized(): boolean {
    return fs.existsSync(this.personahubDir) && 
           fs.existsSync(path.join(this.personahubDir, 'history.db'));
  }

  ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error('PersonaHub not initialized. Run "personahub init" first.');
    }
  }

  init(): { fileCount: number } {
    // Create directories
    fs.mkdirSync(this.personahubDir, { recursive: true });
    fs.mkdirSync(path.join(this.personahubDir, 'snapshots'), { recursive: true });
    
    // Create config
    const configPath = getConfigPath(this.workDir);
    saveConfig(configPath, DEFAULT_CONFIG);
    this.config = DEFAULT_CONFIG;
    
    // Initialize database
    const dbPath = path.join(this.personahubDir, 'history.db');
    this.db = new DatabaseManager(dbPath);
    
    // Count tracked files
    const trackedFiles = getTrackedFiles(this.workDir, this.config);
    
    return { fileCount: trackedFiles.length };
  }

  private getDb(): DatabaseManager {
    if (!this.db) {
      const dbPath = path.join(this.personahubDir, 'history.db');
      this.db = new DatabaseManager(dbPath);
    }
    return this.db;
  }

  private getConfig(): Config {
    if (!this.config) {
      this.config = loadConfig(getConfigPath(this.workDir));
    }
    return this.config;
  }

  createSnapshot(options: CreateSnapshotOptions): CreateSnapshotResult {
    this.ensureInitialized();
    
    const config = this.getConfig();
    const db = this.getDb();
    
    // Get all tracked files
    const files = getTrackedFiles(this.workDir, config);
    
    // Calculate total size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    
    // Generate snapshot hash from file hashes
    const combinedHash = this.generateSnapshotHash(files);
    
    // Create snapshot directory with path validation
    const snapshotDir = validatePath(
      path.join(this.personahubDir, 'snapshots'),
      combinedHash
    );
    fs.mkdirSync(snapshotDir, { recursive: true });
    
    // Copy files to snapshot with path validation
    for (const file of files) {
      const destPath = validatePath(snapshotDir, file.relativePath);
      copyFileSafe(file.path, destPath);
    }
    
    // Insert database records
    const snapshotId = db.insertSnapshot({
      hash: combinedHash,
      message: options.message,
      file_count: files.length,
      total_size: totalSize,
      is_auto: options.isAuto || false,
      is_restore_backup: options.isRestoreBackup || false
    });
    
    db.insertFiles(snapshotId, files.map(f => ({
      path: f.relativePath,
      hash: f.hash,
      size: f.size
    })));
    
    return {
      id: snapshotId,
      hash: combinedHash,
      message: options.message,
      fileCount: files.length,
      totalSize
    };
  }

  private generateSnapshotHash(files: TrackedFile[]): string {
    const content = files
      .map(f => `${f.relativePath}:${f.hash}`)
      .join('\n');
    
    return hashContent(content);
  }

  hasChanges(): boolean {
    const db = this.getDb();
    const latest = db.getLatestSnapshot();
    
    if (!latest) return true;
    
    const config = this.getConfig();
    const currentFiles = getTrackedFiles(this.workDir, config);
    const currentHash = this.generateSnapshotHash(currentFiles);
    
    return currentHash !== latest.hash;
  }

  listSnapshots(limit?: number): Snapshot[] {
    this.ensureInitialized();
    const db = this.getDb();
    const rows = db.getSnapshots(limit);
    
    return rows.map(row => ({
      id: row.id,
      hash: row.hash,
      message: row.message,
      createdAt: row.created_at,
      fileCount: row.file_count,
      totalSize: row.total_size,
      isAuto: row.is_auto === 1,
      isRestoreBackup: row.is_restore_backup === 1
    }));
  }

  getSnapshot(id: number): Snapshot | null {
    this.ensureInitialized();
    const db = this.getDb();
    const row = db.getSnapshotById(id);
    
    if (!row) return null;
    
    return {
      id: row.id,
      hash: row.hash,
      message: row.message,
      createdAt: row.created_at,
      fileCount: row.file_count,
      totalSize: row.total_size,
      isAuto: row.is_auto === 1,
      isRestoreBackup: row.is_restore_backup === 1
    };
  }

  diff(snapshotId: number, compareToId: number | null = null): DiffResult {
    this.ensureInitialized();
    const db = this.getDb();
    
    const snapshot = db.getSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot #${snapshotId} not found`);
    }
    
    const snapshotFiles = db.getFilesForSnapshot(snapshotId);
    const snapshotFileMap = new Map(snapshotFiles.map(f => [f.path, f]));
    
    let compareFiles: Map<string, { path: string; hash: string; content: string }>;
    
    if (compareToId) {
      const compareSnapshot = db.getSnapshotById(compareToId);
      if (!compareSnapshot) {
        throw new Error(`Snapshot #${compareToId} not found`);
      }
      const compareSnapshotFiles = db.getFilesForSnapshot(compareToId);
      compareFiles = new Map();
      for (const f of compareSnapshotFiles) {
        const content = this.getSnapshotFileContent(compareSnapshot.hash, f.path);
        compareFiles.set(f.path, { path: f.path, hash: f.hash, content });
      }
    } else {
      const config = this.getConfig();
      const currentFiles = getTrackedFiles(this.workDir, config);
      compareFiles = new Map();
      for (const f of currentFiles) {
        const content = fs.readFileSync(f.path, 'utf-8');
        compareFiles.set(f.relativePath, { path: f.relativePath, hash: f.hash, content });
      }
    }
    
    const added: string[] = [];
    const removed: string[] = [];
    const modified: ModifiedFile[] = [];
    
    // Find added and modified
    for (const [filePath, current] of compareFiles) {
      const snap = snapshotFileMap.get(filePath);
      if (!snap) {
        added.push(filePath);
      } else if (snap.hash !== current.hash) {
        const snapContent = this.getSnapshotFileContent(snapshot.hash, filePath);
        const diffText = Diff.createPatch(filePath, snapContent, current.content, 'snapshot', 'current');
        const linesChanged = (diffText.match(/^[+-][^+-]/gm) || []).length;
        modified.push({ path: filePath, linesChanged, diff: diffText });
      }
    }
    
    // Find removed
    for (const [filePath] of snapshotFileMap) {
      if (!compareFiles.has(filePath)) {
        removed.push(filePath);
      }
    }
    
    return { added, removed, modified };
  }

  private getSnapshotFileContent(snapshotHash: string, filePath: string): string {
    const fullPath = validatePath(
      path.join(this.personahubDir, 'snapshots', snapshotHash),
      filePath
    );
    return fs.readFileSync(fullPath, 'utf-8');
  }

  getRestorePreview(snapshotId: number): RestorePreview {
    this.ensureInitialized();
    const db = this.getDb();
    
    const snapshot = db.getSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot #${snapshotId} not found`);
    }
    
    const snapshotFiles = db.getFilesForSnapshot(snapshotId);
    const snapshotPaths = new Set(snapshotFiles.map(f => f.path));
    
    const config = this.getConfig();
    const currentFiles = getTrackedFiles(this.workDir, config);
    const currentPaths = new Set(currentFiles.map(f => f.relativePath));
    
    const overwrite: string[] = [];
    const remove: string[] = [];
    const restore: string[] = [];
    
    for (const p of snapshotPaths) {
      if (currentPaths.has(p)) {
        overwrite.push(p);
      } else {
        restore.push(p);
      }
    }
    
    for (const p of currentPaths) {
      if (!snapshotPaths.has(p)) {
        remove.push(p);
      }
    }
    
    return { overwrite, remove, restore };
  }

  restore(snapshotId: number): RestoreResult {
    this.ensureInitialized();
    const db = this.getDb();
    
    const snapshot = db.getSnapshotById(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot #${snapshotId} not found`);
    }
    
    // CRITICAL: Create backup FIRST
    const backup = this.createSnapshot({
      message: `Backup before restore to #${snapshotId}`,
      isAuto: false,
      isRestoreBackup: true
    });
    
    // Atomic restore using staging directory
    const stagingDir = path.join(this.personahubDir, 'staging');
    fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.mkdirSync(stagingDir, { recursive: true });
    
    const snapshotFiles = db.getFilesForSnapshot(snapshotId);
    const snapshotDir = path.join(this.personahubDir, 'snapshots', snapshot.hash);
    
    // Step 1: Copy to staging
    for (const file of snapshotFiles) {
      const srcPath = validatePath(snapshotDir, file.path);
      const stagingPath = validatePath(stagingDir, file.path);
      copyFileSafe(srcPath, stagingPath);
    }
    
    // Step 2: Verify staging
    for (const file of snapshotFiles) {
      const stagingPath = validatePath(stagingDir, file.path);
      if (!fs.existsSync(stagingPath)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
        throw new Error(`Staging failed for ${file.path}`);
      }
    }
    
    // Step 3: Move from staging to workspace
    for (const file of snapshotFiles) {
      const stagingPath = validatePath(stagingDir, file.path);
      const destPath = validatePath(this.workDir, file.path);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Use copy + delete instead of rename (works across filesystems)
      fs.copyFileSync(stagingPath, destPath);
    }
    
    // Step 4: Cleanup staging
    fs.rmSync(stagingDir, { recursive: true, force: true });
    
    return {
      backupId: backup.id,
      restoredFiles: snapshotFiles.length
    };
  }
}
