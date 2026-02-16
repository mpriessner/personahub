---
epic: E2
title: Snapshot Operations
priority: Must
status: Draft
stories: 5
---

# Epic 2: Snapshot Operations

**Goal:** Implement core snapshot functionality - save, list, diff, restore.

**Dependencies:** Epic 1 (Core CLI & Storage)

---

## Story 2.1: Create Snapshot

**As a** developer,
**I want to** run `personahub save` to create a snapshot,
**So that** the current state of my personas is preserved.

### Acceptance Criteria

**Given** PersonaHub is initialized and tracked files exist
**When** I run `personahub save "Added humor trait"`
**Then** All tracked files are copied to `.personahub/snapshots/<hash>/`
**And** A new record is inserted into the `snapshots` table
**And** File records are inserted into `snapshot_files` table
**And** I see: "✓ Snapshot created: #1 - Added humor trait (5 files, 12.3 KB)"

**Given** No message is provided
**When** I run `personahub save`
**Then** Auto-generated message: "Snapshot 2026-02-16 08:46"

**Given** `--auto` flag is provided
**When** I run `personahub save --auto`
**Then** Snapshot is created with message "Auto-snapshot 2026-02-16 08:46"
**And** `is_auto` flag is set to 1 in database

**Given** `--quiet` flag is provided
**When** I run `personahub save --quiet`
**Then** No output is produced
**And** Exit code 0 on success

**Given** No files have changed since last snapshot
**When** I run `personahub save`
**Then** Snapshot is still created (default behavior)

**Given** No files have changed and `--skip-unchanged` is used
**When** I run `personahub save --skip-unchanged`
**Then** No snapshot is created
**And** Message: "No changes detected, skipping snapshot"
**And** Exit code 0

### Technical Notes
- Generate snapshot hash from combined file hashes
- Store full file copies (no delta for MVP)
- Support both relative and absolute paths

### Estimate
- Dev: 2 hours
- Test: 1 hour

---

## Story 2.2: List Snapshots (Timeline)

**As a** developer,
**I want to** run `personahub list` to see all snapshots,
**So that** I can browse the history.

### Acceptance Criteria

**Given** Multiple snapshots exist
**When** I run `personahub list`
**Then** I see a timeline:
```
PersonaHub Timeline (5 snapshots)
─────────────────────────────────

  #5  2026-02-16 08:46  Added humor trait         5 files   12.3 KB
  #4  2026-02-15 06:00  Auto-snapshot            5 files   11.8 KB
  #3  2026-02-14 06:00  Auto-snapshot            4 files   10.2 KB
  #2  2026-02-13 14:22  Updated memory           4 files    9.5 KB
  #1  2026-02-12 10:00  Initial setup            3 files    5.1 KB

Use 'personahub diff <id>' to see changes
Use 'personahub restore <id>' to restore
```

**And** Most recent is at top
**And** Auto-snapshots are indicated (optional styling)

**Given** `--limit 3` is provided
**When** I run `personahub list --limit 3`
**Then** Only 3 most recent snapshots are shown

**Given** No snapshots exist
**When** I run `personahub list`
**Then** Message: "No snapshots yet. Run 'personahub save' to create one."

### Technical Notes
- Query snapshots ordered by created_at DESC
- Format dates nicely (relative if recent)
- Show file size in human-readable format

### Estimate
- Dev: 1 hour
- Test: 30 min

---

## Story 2.3: Diff Between Versions

**As a** developer,
**I want to** run `personahub diff <id>` to see changes,
**So that** I can understand what changed between versions.

### Acceptance Criteria

**Given** Snapshots exist
**When** I run `personahub diff 3`
**Then** I see diff between snapshot #3 and current state:
```
Comparing snapshot #3 (2026-02-14) with current

Files changed: 2 added, 0 removed, 1 modified

+ memory/2026-02-15.md (new file)
+ memory/2026-02-16.md (new file)
~ SOUL.md (3 lines changed)

─── SOUL.md ───────────────────────────────
@@ -5,3 +5,6 @@
 - Be helpful
 - Be concise
+- Have a sense of humor
+- Use emoji occasionally
+- Remember user preferences
```

**Given** Two snapshot IDs are provided
**When** I run `personahub diff 3 5`
**Then** I see diff between snapshot #3 and snapshot #5

**Given** `--stat` flag is provided
**When** I run `personahub diff 3 --stat`
**Then** Only summary is shown (no line-level diff)

**Given** Snapshot ID doesn't exist
**When** I run `personahub diff 999`
**Then** Error: "Snapshot #999 not found"

### Technical Notes
- Use unified diff format
- Color-code additions (green) and deletions (red)
- Truncate long diffs with option to see full

### Estimate
- Dev: 2 hours
- Test: 1 hour

---

## Story 2.4: Restore Snapshot

**As a** developer,
**I want to** run `personahub restore <id>` to rollback,
**So that** I can recover from unwanted changes.

### Acceptance Criteria

**Given** A snapshot exists
**When** I run `personahub restore 3`
**Then** I see a preview:
```
Restore to snapshot #3 (2026-02-14)?

This will:
  - Overwrite 3 files
  - Remove 2 files (added after snapshot)
  - A backup snapshot will be created first

Proceed? [y/N]
```

**Given** I confirm with 'y'
**When** Restore executes
**Then** A backup snapshot is created automatically
**And** All tracked files are replaced with snapshot #3 versions
**And** I see: "✓ Restored to snapshot #3 (backup: #6)"

**Given** I respond with 'n' or press Enter
**When** Restore is cancelled
**Then** No changes are made
**And** Message: "Restore cancelled"

**Given** `--force` flag is provided
**When** I run `personahub restore 3 --force`
**Then** No confirmation is asked
**And** Restore proceeds immediately

**Given** Snapshot doesn't exist
**When** I run `personahub restore 999`
**Then** Error: "Snapshot #999 not found"

### Technical Notes
- ALWAYS create backup before restore (safety)
- Mark backup snapshot with is_restore_backup = 1
- Handle file deletions carefully

### Estimate
- Dev: 2 hours
- Test: 1.5 hours

---

## Story 2.5: Integration & E2E Tests - Snapshots

**As a** developer,
**I want** integration tests for snapshot operations,
**So that** the full workflow is validated.

### Acceptance Criteria

**Given** The test suite
**When** I run `npm test`
**Then** The following test cases pass:

**Save Tests:**
- [ ] Save creates snapshot directory
- [ ] Save records metadata in database
- [ ] Save with message stores message
- [ ] Save without message uses auto-generated
- [ ] Save --auto sets is_auto flag
- [ ] Save --quiet produces no output
- [ ] Save --skip-unchanged skips when no changes

**List Tests:**
- [ ] List shows all snapshots
- [ ] List orders by newest first
- [ ] List --limit works correctly
- [ ] List with no snapshots shows helpful message

**Diff Tests:**
- [ ] Diff shows added files
- [ ] Diff shows removed files
- [ ] Diff shows modified files
- [ ] Diff shows line-level changes
- [ ] Diff between two snapshots works
- [ ] Diff with invalid ID shows error

**Restore Tests:**
- [ ] Restore creates backup first
- [ ] Restore replaces files correctly
- [ ] Restore handles file deletions
- [ ] Restore --force skips confirmation
- [ ] Restore with invalid ID shows error
- [ ] Restore marks backup appropriately

**E2E Workflow Test:**
- [ ] Full cycle: init → save → modify → save → list → diff → restore → verify

### Coverage Target
- Commands: 80%
- Core operations: 90%

### Estimate
- Dev: 3 hours
