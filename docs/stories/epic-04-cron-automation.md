---
epic: E4
title: Cron & Automation
priority: Should
status: Draft
stories: 3
---

# Epic 4: Cron & Automation

**Goal:** Enable automated daily snapshots via cron integration.

**Dependencies:** Epic 2 (Snapshot Operations)

---

## Story 4.1: Cron-Friendly CLI

**As a** developer,
**I want** `personahub save` to work silently in cron,
**So that** daily backups run without interaction.

### Acceptance Criteria

**Given** A cron job runs `personahub save --auto`
**When** Executed non-interactively
**Then** No prompts or user input required
**And** Exit code 0 on success
**And** Exit code 1 on error

**Given** `--quiet` flag is used
**When** Command runs successfully
**Then** Zero output to stdout
**And** Errors still go to stderr

**Given** `--auto` flag is used
**When** Snapshot is created
**Then** Message is "Auto-snapshot YYYY-MM-DD HH:MM"
**And** `is_auto` field is set in database

### Cron Examples
```bash
# Daily at 6 AM
0 6 * * * cd /home/user/workspace && /usr/local/bin/personahub save --auto --quiet

# Every 6 hours
0 */6 * * * cd /home/user/workspace && personahub save --auto --quiet

# With logging
0 6 * * * cd /home/user/workspace && personahub save --auto >> /var/log/personahub.log 2>&1
```

### Technical Notes
- Detect non-TTY environment
- Never prompt when stdin is not a terminal
- Proper exit codes for scripting

### Estimate
- Dev: 1 hour
- Test: 1 hour (including actual cron test)

---

## Story 4.2: Skip Unchanged

**As a** developer,
**I want** PersonaHub to skip snapshots if nothing changed,
**So that** I don't waste storage on duplicate snapshots.

### Acceptance Criteria

**Given** Cron runs `personahub save --auto --skip-unchanged`
**When** No files have changed since last snapshot
**Then** No new snapshot is created
**And** Message: "No changes detected, skipping snapshot"
**And** Exit code 0 (success, not error)

**Given** Files have changed since last snapshot
**When** `--skip-unchanged` is used
**Then** Normal snapshot is created

**Given** No previous snapshots exist
**When** `--skip-unchanged` is used
**Then** First snapshot is always created

### Detection Logic
1. Get file list from last snapshot
2. Compare current files:
   - Same files present?
   - Same file hashes?
3. If any difference → create snapshot
4. If identical → skip

### Technical Notes
- Compare file hashes, not timestamps
- Handle new/deleted files
- Log skipped snapshots for audit

### Estimate
- Dev: 1.5 hours
- Test: 1 hour

---

## Story 4.3: Retention & Cleanup

**As a** developer,
**I want** old snapshots to be cleaned up automatically,
**So that** storage doesn't grow unbounded.

### Acceptance Criteria

**Given** Config has `"retention": { "days": 30, "minSnapshots": 5 }`
**When** `personahub cleanup` is run
**Then** Snapshots older than 30 days are removed
**But** At least 5 most recent snapshots are always kept

**Given** `personahub save --auto --cleanup` is run
**When** Snapshot is created
**Then** Cleanup runs automatically after save

**Given** Manual snapshots exist
**When** Cleanup runs
**Then** Manual snapshots are kept longer (60 days default)
**And** Only auto-snapshots follow shorter retention

### Config Example
```json
{
  "retention": {
    "autoSnapshotDays": 30,
    "manualSnapshotDays": 90,
    "minSnapshots": 5
  }
}
```

### Technical Notes
- Delete both database records and files
- Respect minSnapshots as safety
- Log what was deleted

### Estimate
- Dev: 2 hours
- Test: 1 hour
