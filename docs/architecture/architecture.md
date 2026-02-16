---
document: Architecture Document
project: PersonaHub
version: 1.0
date: 2026-02-16
author: Martin Priessner
status: Draft
---

# Architecture Document: PersonaHub

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PersonaHub                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │     CLI      │    │   Web UI     │    │  Cron/Auto   │   │
│  │  (Commander) │    │  (Express)   │    │   Script     │   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘   │
│         │                   │                   │            │
│         └───────────────────┼───────────────────┘            │
│                             │                                │
│                    ┌────────▼────────┐                       │
│                    │   Core Engine   │                       │
│                    │                 │                       │
│                    │ • SnapshotMgr   │                       │
│                    │ • DiffEngine    │                       │
│                    │ • RestoreEngine │                       │
│                    │ • ConfigMgr     │                       │
│                    └────────┬────────┘                       │
│                             │                                │
│              ┌──────────────┼──────────────┐                 │
│              │              │              │                 │
│      ┌───────▼───────┐ ┌────▼────┐ ┌──────▼──────┐          │
│      │   SQLite DB   │ │  File   │ │   Config    │          │
│      │  (history.db) │ │ Storage │ │   (JSON)    │          │
│      └───────────────┘ └─────────┘ └─────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| CLI Framework | Commander.js | Industry standard, excellent DX |
| Web Server | Express.js | Simple, minimal |
| Web UI | Vanilla HTML/JS | No build step, simple |
| Database | better-sqlite3 | Synchronous, fast, no server |
| File Operations | Node.js fs | Native, cross-platform |
| Hashing | Node.js crypto | Built-in, SHA-256 |
| Glob Patterns | glob | De-facto standard |
| Output Formatting | chalk | Colorful CLI output |

### 1.3 Design Principles

1. **Simplicity First**: Fewer features, perfectly executed
2. **Local Only**: No network, no cloud, no sync (MVP)
3. **Content-Addressable**: Files stored by hash for deduplication
4. **Synchronous Operations**: No async complexity for CLI
5. **Fail Safe**: Always create backup before destructive operations

## 2. Component Design

### 2.1 Directory Structure

```
personahub/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Library exports
│   ├── commands/
│   │   ├── init.ts
│   │   ├── save.ts
│   │   ├── list.ts
│   │   ├── diff.ts
│   │   ├── restore.ts
│   │   └── serve.ts
│   ├── core/
│   │   ├── engine.ts       # Main PersonaHub engine
│   │   ├── snapshot.ts     # Snapshot operations
│   │   ├── diff.ts         # Diff generation
│   │   ├── restore.ts      # Restore operations
│   │   └── config.ts       # Config management
│   ├── storage/
│   │   ├── database.ts     # SQLite wrapper
│   │   └── files.ts        # File storage operations
│   ├── ui/
│   │   ├── server.ts       # Express server
│   │   └── public/         # Static HTML/JS/CSS
│   │       ├── index.html
│   │       ├── app.js
│   │       └── style.css
│   └── utils/
│       ├── hash.ts         # Hashing utilities
│       ├── glob.ts         # File pattern matching
│       └── output.ts       # CLI output formatting
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 Core Engine

```typescript
// src/core/engine.ts

interface PersonaHubEngine {
  // Initialization
  init(options?: InitOptions): void;
  isInitialized(): boolean;
  
  // Snapshots
  createSnapshot(message?: string, options?: SnapshotOptions): Snapshot;
  listSnapshots(options?: ListOptions): Snapshot[];
  getSnapshot(id: number | string): Snapshot | null;
  
  // Diff
  diffWithCurrent(snapshotId: number): DiffResult;
  diffSnapshots(id1: number, id2: number): DiffResult;
  
  // Restore
  restore(snapshotId: number, options?: RestoreOptions): RestoreResult;
  
  // Config
  getConfig(): Config;
  updateConfig(partial: Partial<Config>): void;
}

interface Snapshot {
  id: number;
  hash: string;
  message: string;
  createdAt: Date;
  fileCount: number;
  totalSize: number;
  isAuto: boolean;
  isRestoreBackup: boolean;
  files?: SnapshotFile[];
}

interface SnapshotFile {
  path: string;
  hash: string;
  size: number;
}

interface DiffResult {
  added: string[];
  removed: string[];
  modified: DiffFile[];
  unchanged: string[];
}

interface DiffFile {
  path: string;
  changes: LineChange[];
}
```

### 2.3 Database Layer

```typescript
// src/storage/database.ts

class Database {
  private db: BetterSqlite3.Database;
  
  constructor(dbPath: string) {
    this.db = new BetterSqlite3(dbPath);
    this.migrate();
  }
  
  // Snapshot operations
  insertSnapshot(data: SnapshotInsert): number;
  getSnapshots(limit?: number): SnapshotRow[];
  getSnapshotById(id: number): SnapshotRow | null;
  getSnapshotByHash(hash: string): SnapshotRow | null;
  
  // File operations
  insertFiles(snapshotId: number, files: FileInsert[]): void;
  getFilesForSnapshot(snapshotId: number): FileRow[];
  
  // Utility
  close(): void;
}
```

### 2.4 File Storage

```typescript
// src/storage/files.ts

class FileStorage {
  private snapshotsDir: string;
  
  constructor(baseDir: string) {
    this.snapshotsDir = path.join(baseDir, 'snapshots');
  }
  
  // Store files for a snapshot
  storeSnapshot(hash: string, files: TrackedFile[]): void;
  
  // Retrieve files from a snapshot
  getSnapshotFiles(hash: string): Map<string, Buffer>;
  
  // Check if file exists
  hasFile(hash: string, filePath: string): boolean;
  
  // Compute file hash
  hashFile(filePath: string): string;
  
  // Get tracked files in workspace
  getTrackedFiles(config: Config): TrackedFile[];
}
```

## 3. Data Flow

### 3.1 Snapshot Creation

```
User: personahub save "Added humor"
           │
           ▼
┌─────────────────────────┐
│   1. Load Config        │
│   2. Get tracked files  │
│   3. Hash each file     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   4. Compare with last  │
│      snapshot (optional)│
│   5. Skip if no changes │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   6. Generate snapshot  │
│      hash (combined)    │
│   7. Copy files to      │
│      snapshots/<hash>/  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   8. Insert DB record   │
│   9. Insert file records│
│   10. Output success    │
└─────────────────────────┘
```

### 3.2 Restore Operation

```
User: personahub restore 3
           │
           ▼
┌─────────────────────────┐
│   1. Get snapshot #3    │
│   2. Show preview diff  │
│   3. Ask confirmation   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   4. Create backup      │
│      snapshot (current) │
│   5. Mark as restore    │
│      backup             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   6. Copy snapshot #3   │
│      files to workspace │
│   7. Output success     │
└─────────────────────────┘
```

## 4. API Design

### 4.1 Web UI API Endpoints

```
GET  /api/snapshots          # List all snapshots
GET  /api/snapshots/:id      # Get snapshot details
GET  /api/snapshots/:id/files # List files in snapshot
GET  /api/snapshots/:id/file/:path # Get file content
GET  /api/diff/:id           # Diff snapshot vs current
GET  /api/diff/:id1/:id2     # Diff two snapshots
POST /api/restore/:id        # Restore to snapshot
GET  /api/status             # Current workspace status
```

### 4.2 Response Formats

```typescript
// Snapshot list response
interface SnapshotsResponse {
  snapshots: Snapshot[];
  total: number;
}

// Diff response
interface DiffResponse {
  snapshot: Snapshot;
  compareTo: 'current' | Snapshot;
  diff: DiffResult;
}

// Restore response
interface RestoreResponse {
  success: boolean;
  restoredFrom: Snapshot;
  backupCreated: Snapshot;
}
```

## 5. Error Handling

### 5.1 Error Types

```typescript
enum PersonaHubError {
  NOT_INITIALIZED = 'PERSONAHUB_NOT_INITIALIZED',
  ALREADY_INITIALIZED = 'PERSONAHUB_ALREADY_INITIALIZED',
  SNAPSHOT_NOT_FOUND = 'SNAPSHOT_NOT_FOUND',
  NO_CHANGES = 'NO_CHANGES_DETECTED',
  RESTORE_FAILED = 'RESTORE_FAILED',
  CONFIG_INVALID = 'CONFIG_INVALID',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### 5.2 Error Messages

All errors include:
- Clear description of what went wrong
- Suggestion for how to fix
- Exit code for scripts

Example:
```
Error: PersonaHub not initialized

Run 'personahub init' to initialize this workspace.
```

## 6. Testing Strategy

### 6.1 Test Levels

| Level | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Jest | 80% |
| Integration | Jest | Key workflows |
| E2E | Custom scripts | CLI commands |

### 6.2 Test Categories

- **Unit Tests**: Core engine, database, file storage
- **Integration Tests**: Full command workflows
- **E2E Tests**: CLI invocation, cron simulation

## 7. Security Considerations

### 7.1 Implemented
- No network access (local-only)
- No telemetry or analytics
- File permissions preserved on restore
- SQLite database not exposed externally

### 7.2 Out of Scope (MVP)
- Encryption at rest
- Access control
- Audit logging

## 8. Future Architecture Considerations

### 8.1 Remote Sync (Future)
- S3/GCS storage adapter
- Conflict resolution strategy
- Authentication layer

### 8.2 Real-time Watching (Future)
- File system watcher
- Debounced auto-snapshots
- Background daemon

---

**Next:** Epics & Stories with Test Stories
