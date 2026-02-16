// Core types for PersonaHub

export interface Snapshot {
  id: number;
  hash: string;
  message: string | null;
  createdAt: string;
  fileCount: number;
  totalSize: number;
  isAuto: boolean;
  isRestoreBackup: boolean;
}

export interface SnapshotFile {
  path: string;
  hash: string;
  size: number;
}

export interface TrackedFile {
  path: string;           // Absolute path
  relativePath: string;   // Relative to workDir
  size: number;
  hash: string;
}

export interface CreateSnapshotOptions {
  message: string;
  isAuto?: boolean;
  isRestoreBackup?: boolean;
}

export interface CreateSnapshotResult {
  id: number;
  hash: string;
  message: string;
  fileCount: number;
  totalSize: number;
}

export interface RestorePreview {
  overwrite: string[];
  remove: string[];
  restore: string[];
}

export interface RestoreResult {
  backupId: number;
  restoredFiles: number;
}

export interface DiffResult {
  added: string[];
  removed: string[];
  modified: ModifiedFile[];
}

export interface ModifiedFile {
  path: string;
  linesChanged: number;
  diff: string;
}
