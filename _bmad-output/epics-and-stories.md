---
stepsCompleted: []
inputDocuments:
  - brainstorming/brainstorming-session-2026-02-16.md
  - research-existing-solutions.md
project_name: PersonaHub
created: 2026-02-16
---

# PersonaHub - Epic & Story Breakdown

## Overview

Simplified version control system for AI agent personas. Enables daily snapshots, timeline browsing, and restoration of persona configurations.

## Requirements Summary (from Brainstorming)

### Functional Requirements
- FR1: Initialize PersonaHub in a workspace
- FR2: Create manual snapshots with optional message
- FR3: List all snapshots (timeline view)
- FR4: Show diff between versions
- FR5: Restore to a previous snapshot
- FR6: Web UI for Time Machine-style browsing
- FR7: Cron-compatible for automated daily snapshots

### Non-Functional Requirements
- NFR1: Simple CLI (fewer commands than Git)
- NFR2: Fast execution (<1s for common operations)
- NFR3: Minimal dependencies
- NFR4: SQLite for metadata (portable)
- NFR5: Works with any file-based persona structure

---

## Epic List

| Epic | Title | Stories | Priority |
|------|-------|---------|----------|
| E1 | Core CLI & Storage | 5 | 🔴 Must |
| E2 | Snapshot Operations | 4 | 🔴 Must |
| E3 | Time Machine Web UI | 3 | 🟡 Should |
| E4 | Cron & Automation | 2 | 🟡 Should |

---

## Epic 1: Core CLI & Storage

**Goal:** Establish the foundational CLI structure and storage mechanism for PersonaHub.

### Story 1.1: Project Initialization

As a **developer**,
I want to run `personahub init` in my workspace,
So that PersonaHub starts tracking my persona files.

**Acceptance Criteria:**

**Given** I am in a directory with persona files (SOUL.md, MEMORY.md, etc.)
**When** I run `personahub init`
**Then** A `.personahub/` directory is created
**And** A SQLite database is initialized at `.personahub/history.db`
**And** A config file is created at `.personahub/config.json`
**And** I see confirmation message "PersonaHub initialized ✓"

---

### Story 1.2: CLI Framework Setup

As a **developer**,
I want a clean CLI with help commands,
So that I can discover available commands easily.

**Acceptance Criteria:**

**Given** PersonaHub is installed globally
**When** I run `personahub --help`
**Then** I see all available commands with descriptions
**And** Each command has its own `--help` option

**Commands:**
- `personahub init` - Initialize in current directory
- `personahub save [message]` - Create snapshot
- `personahub list` - Show timeline
- `personahub diff <id>` - Compare versions
- `personahub restore <id>` - Restore to version
- `personahub serve` - Start web UI

---

### Story 1.3: SQLite Schema Design

As a **system**,
I need a database schema to store version history,
So that snapshots can be queried and managed efficiently.

**Acceptance Criteria:**

**Given** PersonaHub is initialized
**When** The database is created
**Then** The following tables exist:

```sql
CREATE TABLE snapshots (
  id INTEGER PRIMARY KEY,
  hash TEXT UNIQUE,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_count INTEGER,
  total_size INTEGER
);

CREATE TABLE files (
  id INTEGER PRIMARY KEY,
  snapshot_id INTEGER REFERENCES snapshots(id),
  path TEXT,
  hash TEXT,
  size INTEGER,
  content_ref TEXT  -- reference to blob storage
);
```

---

### Story 1.4: Config Management

As a **developer**,
I want to configure which files PersonaHub tracks,
So that I can include/exclude specific files.

**Acceptance Criteria:**

**Given** PersonaHub is initialized
**When** I check `.personahub/config.json`
**Then** I see default configuration:

```json
{
  "version": 1,
  "include": ["*.md", "*.yaml", "*.json"],
  "exclude": [".personahub/**", "node_modules/**"],
  "snapshotDir": ".personahub/snapshots"
}
```

---

### Story 1.5: NPM Package Setup

As a **developer**,
I want to install PersonaHub globally via npm,
So that I can use it in any project.

**Acceptance Criteria:**

**Given** PersonaHub is published to npm
**When** I run `npm install -g personahub`
**Then** The `personahub` command is available globally
**And** Running `personahub --version` shows the version number

---

## Epic 2: Snapshot Operations

**Goal:** Implement core snapshot functionality - save, list, diff, restore.

### Story 2.1: Create Snapshot

As a **developer**,
I want to run `personahub save` to create a snapshot,
So that the current state of my personas is preserved.

**Acceptance Criteria:**

**Given** PersonaHub is initialized and files exist
**When** I run `personahub save "Added humor trait"`
**Then** All tracked files are copied to `.personahub/snapshots/<hash>/`
**And** A new record is inserted into the `snapshots` table
**And** I see: "Snapshot created: abc123 - Added humor trait (5 files)"

**Given** No message is provided
**When** I run `personahub save`
**Then** Auto-generated message: "Snapshot 2026-02-16 08:46"

---

### Story 2.2: List Snapshots (Timeline)

As a **developer**,
I want to run `personahub list` to see all snapshots,
So that I can browse the history.

**Acceptance Criteria:**

**Given** Multiple snapshots exist
**When** I run `personahub list`
**Then** I see a timeline:

```
PersonaHub Timeline
───────────────────
 #5  2026-02-16 08:46  abc123  Added humor trait (5 files)
 #4  2026-02-15 06:00  def456  Daily auto-snapshot (5 files)
 #3  2026-02-14 06:00  ghi789  Daily auto-snapshot (4 files)
 ...
```

**And** Most recent is at top
**And** I can use `--limit N` to show only N entries

---

### Story 2.3: Diff Between Versions

As a **developer**,
I want to run `personahub diff <id>` to see changes,
So that I can understand what changed between versions.

**Acceptance Criteria:**

**Given** Snapshots exist
**When** I run `personahub diff 3`
**Then** I see diff between snapshot #3 and current state:

```
Comparing snapshot #3 (2026-02-14) with current:

SOUL.md
  + Added: "I have a sense of humor"
  - Removed: (none)

MEMORY.md
  ~ Modified: 12 lines added
```

**Given** Two snapshot IDs
**When** I run `personahub diff 3 5`
**Then** I see diff between snapshot #3 and #5

---

### Story 2.4: Restore Snapshot

As a **developer**,
I want to run `personahub restore <id>` to rollback,
So that I can recover from unwanted changes.

**Acceptance Criteria:**

**Given** A snapshot exists
**When** I run `personahub restore 3`
**Then** I see a preview of what will change
**And** I am asked to confirm: "Restore to snapshot #3? (y/N)"

**Given** I confirm with 'y'
**When** Restore executes
**Then** All tracked files are replaced with snapshot #3 versions
**And** A new "restore" snapshot is auto-created (safety backup)
**And** I see: "Restored to snapshot #3 ✓ (backup created: #6)"

---

## Epic 3: Time Machine Web UI

**Goal:** Provide a visual web interface for browsing and restoring snapshots.

### Story 3.1: Start Web Server

As a **developer**,
I want to run `personahub serve` to start the UI,
So that I can visually browse my snapshot history.

**Acceptance Criteria:**

**Given** PersonaHub is initialized
**When** I run `personahub serve`
**Then** A local web server starts on port 3000
**And** I see: "Time Machine UI running at http://localhost:3000"
**And** My browser opens automatically (optional flag: `--no-open`)

---

### Story 3.2: Timeline View

As a **developer**,
I want to see a visual timeline of all snapshots,
So that I can navigate through history easily.

**Acceptance Criteria:**

**Given** The web UI is open
**When** I view the main page
**Then** I see a horizontal/vertical timeline with:
  - Date/time of each snapshot
  - Snapshot message
  - File count
  - Visual indicator of "distance" from current

**And** I can click on any snapshot to select it
**And** Current state is clearly marked

---

### Story 3.3: Visual Diff & Restore

As a **developer**,
I want to see file changes and restore from the UI,
So that I can make decisions without using CLI.

**Acceptance Criteria:**

**Given** I selected a snapshot in the timeline
**When** I view the detail panel
**Then** I see:
  - List of files in that snapshot
  - Diff preview (side-by-side or unified)
  - "Restore" button

**Given** I click "Restore"
**When** Confirmation dialog appears
**Then** I can confirm or cancel
**And** Success message shows after restore

---

## Epic 4: Cron & Automation

**Goal:** Enable automated daily snapshots via cron integration.

### Story 4.1: Cron-Friendly CLI

As a **developer**,
I want `personahub save` to work silently in cron,
So that daily backups run without interaction.

**Acceptance Criteria:**

**Given** A cron job runs `personahub save --auto`
**When** Executed non-interactively
**Then** No prompts or user input required
**And** Exit code 0 on success, non-zero on failure
**And** Quiet output (or `--quiet` flag for zero output)

**Example cron entry:**
```
0 6 * * * cd /home/martin/clawd && /usr/local/bin/personahub save --auto --quiet
```

---

### Story 4.2: Skip Unchanged

As a **developer**,
I want PersonaHub to skip snapshots if nothing changed,
So that I don't waste storage on duplicate snapshots.

**Acceptance Criteria:**

**Given** Cron runs `personahub save --auto`
**When** No files have changed since last snapshot
**Then** No new snapshot is created
**And** Exit message: "No changes detected, skipping snapshot"
**And** Exit code 0 (success, not error)

---

## Implementation Order (Recommended)

### Today (MVP):
1. Story 1.5 - NPM package setup
2. Story 1.1 - Project initialization
3. Story 1.2 - CLI framework
4. Story 1.3 - SQLite schema
5. Story 2.1 - Create snapshot
6. Story 2.2 - List snapshots
7. Story 2.4 - Restore snapshot

### Stretch Today:
8. Story 2.3 - Diff
9. Story 3.1 - Web server
10. Story 3.2 - Timeline view

### Later:
- Story 3.3 - Visual diff & restore
- Story 4.1 - Cron-friendly
- Story 4.2 - Skip unchanged
