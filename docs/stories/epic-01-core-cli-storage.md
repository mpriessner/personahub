---
epic: E1
title: Core CLI & Storage
priority: Must
status: Draft
stories: 6
---

# Epic 1: Core CLI & Storage

**Goal:** Establish the foundational CLI structure and storage mechanism for PersonaHub.

**Dependencies:** None (first epic)

---

## Story 1.1: NPM Package Setup

**As a** developer,
**I want to** install PersonaHub globally via npm,
**So that** I can use it in any project.

### Acceptance Criteria

**Given** PersonaHub source code is ready
**When** I run `npm install -g personahub`
**Then** The `personahub` command is available globally
**And** Running `personahub --version` shows the version number
**And** Running `personahub --help` shows available commands

### Technical Notes
- Package name: `personahub`
- Binary entry: `dist/cli.js`
- TypeScript build required before publish

### Estimate
- Dev: 1 hour
- Test: 30 min

---

## Story 1.2: CLI Framework Setup

**As a** developer,
**I want to** have a clean CLI with help commands,
**So that** I can discover available commands easily.

### Acceptance Criteria

**Given** PersonaHub is installed globally
**When** I run `personahub --help`
**Then** I see all available commands with descriptions:
```
Commands:
  init              Initialize PersonaHub in current directory
  save [message]    Create a new snapshot
  list              Show snapshot timeline
  diff <id> [id2]   Compare versions
  restore <id>      Restore to a snapshot
  serve             Start Time Machine web UI
```
**And** Each command has its own `--help` option with usage details

### Technical Notes
- Use Commander.js
- Support both long and short flags
- Use chalk for colored output

### Estimate
- Dev: 1 hour
- Test: 30 min

---

## Story 1.3: Project Initialization

**As a** developer,
**I want to** run `personahub init` in my workspace,
**So that** PersonaHub starts tracking my persona files.

### Acceptance Criteria

**Given** I am in a directory with persona files
**When** I run `personahub init`
**Then** A `.personahub/` directory is created
**And** A SQLite database is initialized at `.personahub/history.db`
**And** A config file is created at `.personahub/config.json`
**And** A `snapshots/` subdirectory is created
**And** I see confirmation message "✓ PersonaHub initialized"

**Given** PersonaHub is already initialized
**When** I run `personahub init`
**Then** I see error "PersonaHub already initialized in this directory"
**And** Exit code is 1

**Given** PersonaHub is already initialized
**When** I run `personahub init --force`
**Then** The existing `.personahub/` is backed up
**And** A fresh initialization is performed
**And** I see warning "⚠ Re-initialized (backup created)"

### Technical Notes
- Check for existing .personahub/ before init
- Create all required subdirectories
- Initialize SQLite with schema

### Estimate
- Dev: 1.5 hours
- Test: 1 hour

---

## Story 1.4: SQLite Schema Design

**As a** system,
**I need** a database schema to store version history,
**So that** snapshots can be queried and managed efficiently.

### Acceptance Criteria

**Given** PersonaHub is initialized
**When** The database is created
**Then** The following tables exist:
- `snapshots` - stores snapshot metadata
- `snapshot_files` - stores files in each snapshot
- `config_history` - tracks config changes

**And** Appropriate indexes exist for common queries
**And** Foreign key constraints are enforced

### Schema
```sql
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

CREATE TABLE snapshot_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  hash TEXT NOT NULL,
  size INTEGER NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
);

CREATE INDEX idx_snapshots_created_at ON snapshots(created_at DESC);
CREATE INDEX idx_snapshot_files_snapshot_id ON snapshot_files(snapshot_id);
```

### Technical Notes
- Use better-sqlite3 for sync operations
- Run migrations on init

### Estimate
- Dev: 1 hour
- Test: 30 min

---

## Story 1.5: Config Management

**As a** developer,
**I want to** configure which files PersonaHub tracks,
**So that** I can include/exclude specific files.

### Acceptance Criteria

**Given** PersonaHub is initialized
**When** I check `.personahub/config.json`
**Then** I see default configuration:
```json
{
  "version": 1,
  "include": ["*.md", "*.yaml", "*.yml", "*.json"],
  "exclude": [
    ".personahub/**",
    "node_modules/**",
    ".git/**",
    "*.log"
  ],
  "snapshotDir": ".personahub/snapshots"
}
```

**Given** I modify the config file
**When** I run `personahub save`
**Then** The new include/exclude patterns are respected

### Technical Notes
- Use glob for pattern matching
- Validate config on load
- Support .personahubignore file (future)

### Estimate
- Dev: 1 hour
- Test: 30 min

---

## Story 1.6: Unit Tests - Core Storage

**As a** developer,
**I want** unit tests for core storage functionality,
**So that** I can refactor with confidence.

### Acceptance Criteria

**Given** The test suite
**When** I run `npm test`
**Then** The following test cases pass:

**Database Tests:**
- [ ] Database creates tables on init
- [ ] Insert snapshot returns ID
- [ ] Get snapshot by ID returns correct data
- [ ] Get snapshot by hash works
- [ ] List snapshots orders by created_at DESC
- [ ] Delete old snapshots works

**Config Tests:**
- [ ] Default config is valid JSON
- [ ] Include patterns match expected files
- [ ] Exclude patterns filter correctly
- [ ] Invalid config throws error

**File Storage Tests:**
- [ ] Store snapshot creates directory
- [ ] Files are copied correctly
- [ ] Hash computation is deterministic
- [ ] Get tracked files respects config

### Coverage Target
- Core module: 80%
- Storage module: 90%

### Estimate
- Dev: 2 hours
- Test: N/A (this IS testing)
