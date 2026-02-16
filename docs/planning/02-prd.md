---
document: Product Requirements Document
project: PersonaHub
version: 1.0
date: 2026-02-16
author: Martin Priessner
status: Draft
---

# Product Requirements Document: PersonaHub

## 1. Overview

### 1.1 Purpose
This PRD defines the requirements for PersonaHub, a simplified version control system designed specifically for AI agent persona files.

### 1.2 Scope
MVP release (v0.1.0) focusing on local-only operations with CLI and basic web UI.

### 1.3 Definitions
| Term | Definition |
|------|------------|
| Persona | Configuration files defining an AI agent's personality, memory, and behavior |
| Snapshot | A complete copy of all tracked files at a point in time |
| Workspace | A directory containing persona files and `.personahub/` folder |
| Timeline | Chronological list of all snapshots |

## 2. Functional Requirements

### 2.1 Initialization (FR-INIT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-INIT-01 | System shall create `.personahub/` directory on init | Must |
| FR-INIT-02 | System shall create SQLite database for history | Must |
| FR-INIT-03 | System shall create default config.json | Must |
| FR-INIT-04 | System shall detect if already initialized | Must |
| FR-INIT-05 | System shall support re-initialization with `--force` | Should |

### 2.2 Snapshot Creation (FR-SNAP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SNAP-01 | System shall copy all tracked files to snapshot directory | Must |
| FR-SNAP-02 | System shall generate unique hash for each snapshot | Must |
| FR-SNAP-03 | System shall record timestamp, message, and metadata | Must |
| FR-SNAP-04 | System shall accept optional message parameter | Must |
| FR-SNAP-05 | System shall auto-generate message if not provided | Must |
| FR-SNAP-06 | System shall skip snapshot if no changes detected | Should |
| FR-SNAP-07 | System shall support `--auto` flag for cron usage | Must |
| FR-SNAP-08 | System shall support `--quiet` flag for silent operation | Should |

### 2.3 Timeline & History (FR-HIST)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-HIST-01 | System shall list all snapshots in reverse chronological order | Must |
| FR-HIST-02 | System shall display snapshot ID, timestamp, message, file count | Must |
| FR-HIST-03 | System shall support `--limit N` to restrict output | Should |
| FR-HIST-04 | System shall support `--since DATE` filter | Could |
| FR-HIST-05 | System shall indicate current state vs snapshots | Should |

### 2.4 Diff & Comparison (FR-DIFF)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-DIFF-01 | System shall show diff between snapshot and current state | Must |
| FR-DIFF-02 | System shall show diff between two snapshots | Should |
| FR-DIFF-03 | System shall display added/removed/modified files | Must |
| FR-DIFF-04 | System shall show line-level changes for text files | Should |
| FR-DIFF-05 | System shall support `--stat` for summary only | Could |

### 2.5 Restore (FR-REST)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REST-01 | System shall restore all files from specified snapshot | Must |
| FR-REST-02 | System shall prompt for confirmation before restore | Must |
| FR-REST-03 | System shall create backup snapshot before restore | Must |
| FR-REST-04 | System shall support `--force` to skip confirmation | Should |
| FR-REST-05 | System shall support restoring single file | Could |
| FR-REST-06 | System shall report success/failure clearly | Must |

### 2.6 Web UI (FR-UI)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UI-01 | System shall serve web UI on localhost | Should |
| FR-UI-02 | System shall display visual timeline of snapshots | Should |
| FR-UI-03 | System shall allow clicking snapshot to view details | Should |
| FR-UI-04 | System shall show file list and preview for each snapshot | Should |
| FR-UI-05 | System shall provide restore button with confirmation | Could |
| FR-UI-06 | System shall auto-open browser on `serve` command | Could |

### 2.7 Configuration (FR-CONF)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CONF-01 | System shall support include patterns (glob) | Must |
| FR-CONF-02 | System shall support exclude patterns (glob) | Must |
| FR-CONF-03 | System shall have sensible defaults for persona files | Must |
| FR-CONF-04 | System shall validate config on load | Should |

## 3. Non-Functional Requirements

### 3.1 Performance (NFR-PERF)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Init command execution time | < 1 second |
| NFR-PERF-02 | Snapshot creation (100 files, 1MB total) | < 2 seconds |
| NFR-PERF-03 | List command execution time | < 500ms |
| NFR-PERF-04 | Restore execution time | < 3 seconds |
| NFR-PERF-05 | Web UI initial load | < 2 seconds |

### 3.2 Reliability (NFR-REL)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-REL-01 | Restore success rate | 100% |
| NFR-REL-02 | Data integrity after crash | No corruption |
| NFR-REL-03 | Graceful handling of missing files | No crash |

### 3.3 Usability (NFR-USE)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-USE-01 | Commands memorable without documentation | ≤ 6 commands |
| NFR-USE-02 | Clear error messages | Actionable text |
| NFR-USE-03 | Help available for all commands | `--help` works |

### 3.4 Compatibility (NFR-COMP)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-COMP-01 | Node.js version support | ≥ 18.0.0 |
| NFR-COMP-02 | Operating system support | Linux, macOS, Windows |
| NFR-COMP-03 | File system support | POSIX + NTFS |

### 3.5 Security (NFR-SEC)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC-01 | No external network calls | Local-only |
| NFR-SEC-02 | No telemetry or tracking | Privacy-first |
| NFR-SEC-03 | File permissions preserved | Match original |

## 4. User Interface Requirements

### 4.1 CLI Interface

```
personahub <command> [options]

Commands:
  init              Initialize PersonaHub in current directory
  save [message]    Create a new snapshot
  list              Show snapshot timeline
  diff <id> [id2]   Compare versions
  restore <id>      Restore to a snapshot
  serve             Start Time Machine web UI
  
Options:
  --version         Show version number
  --help            Show help
  --quiet           Suppress output (for cron)
  --force           Skip confirmations
```

### 4.2 Web UI Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  PersonaHub - Time Machine                    [Refresh] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Timeline                                               │
│  ─────────────────────────────────────────────────────  │
│  ● Current State                                        │
│  │                                                      │
│  ○ #5 - 2026-02-16 08:46 - Added humor trait           │
│  │     └─ [View] [Diff] [Restore]                      │
│  │                                                      │
│  ○ #4 - 2026-02-15 06:00 - Daily auto-snapshot         │
│  │     └─ [View] [Diff] [Restore]                      │
│  │                                                      │
│  ○ #3 - 2026-02-14 06:00 - Daily auto-snapshot         │
│        └─ [View] [Diff] [Restore]                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Snapshot Details                                       │
│  ─────────────────────────────────────────────────────  │
│  Files:                                                 │
│  • SOUL.md (2.3 KB)                                    │
│  • MEMORY.md (15.1 KB)                                 │
│  • TOOLS.md (4.2 KB)                                   │
│                                                         │
│  [Preview File]                                         │
└─────────────────────────────────────────────────────────┘
```

## 5. Data Requirements

### 5.1 Database Schema

```sql
-- Snapshots table
CREATE TABLE snapshots (
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
CREATE TABLE snapshot_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    hash TEXT NOT NULL,
    size INTEGER NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

-- Configuration history
CREATE TABLE config_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_json TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_snapshots_created_at ON snapshots(created_at);
CREATE INDEX idx_snapshot_files_snapshot_id ON snapshot_files(snapshot_id);
```

### 5.2 File Structure

```
workspace/
├── SOUL.md
├── MEMORY.md
├── TOOLS.md
└── .personahub/
    ├── config.json
    ├── history.db
    └── snapshots/
        ├── abc123/
        │   ├── SOUL.md
        │   ├── MEMORY.md
        │   └── TOOLS.md
        └── def456/
            └── ...
```

## 6. Acceptance Criteria Summary

### MVP Release Criteria
- [ ] All "Must" priority requirements implemented
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] README documentation complete
- [ ] npm package publishable
- [ ] Cron job tested for 24 hours

---

**Next:** Architecture Document
