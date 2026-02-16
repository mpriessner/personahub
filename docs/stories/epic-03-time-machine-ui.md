---
epic: E3
title: Time Machine Web UI
priority: Should
status: Draft
stories: 4
---

# Epic 3: Time Machine Web UI

**Goal:** Provide a visual web interface for browsing and restoring snapshots.

**Dependencies:** Epic 2 (Snapshot Operations)

---

## Story 3.1: Start Web Server

**As a** developer,
**I want to** run `personahub serve` to start the UI,
**So that** I can visually browse my snapshot history.

### Acceptance Criteria

**Given** PersonaHub is initialized with snapshots
**When** I run `personahub serve`
**Then** A local web server starts on port 3000
**And** I see: "🕐 Time Machine UI running at http://localhost:3000"
**And** My browser opens automatically

**Given** Port 3000 is in use
**When** I run `personahub serve`
**Then** Server tries port 3001, 3002, etc.
**And** Message shows actual port used

**Given** `--port 8080` is provided
**When** I run `personahub serve --port 8080`
**Then** Server starts on port 8080

**Given** `--no-open` is provided
**When** I run `personahub serve --no-open`
**Then** Browser does not open automatically

**Given** PersonaHub is not initialized
**When** I run `personahub serve`
**Then** Error: "PersonaHub not initialized. Run 'personahub init' first."

### Technical Notes
- Use Express.js
- Serve static files from ui/public
- Provide JSON API for data

### Estimate
- Dev: 1 hour
- Test: 30 min

---

## Story 3.2: Timeline View

**As a** developer,
**I want to** see a visual timeline of all snapshots,
**So that** I can navigate through history easily.

### Acceptance Criteria

**Given** The web UI is open
**When** I view the main page
**Then** I see a visual timeline with:
  - Vertical list of all snapshots
  - Date/time of each snapshot
  - Snapshot message
  - File count and size
  - Visual connector line between snapshots

**And** Current state is shown at top (marked as "Current")
**And** Auto-snapshots have a different indicator (clock icon)
**And** Restore-backup snapshots are marked (safety icon)

**Given** I click on a snapshot
**When** The snapshot is selected
**Then** It is highlighted
**And** The detail panel updates to show that snapshot

### UI Wireframe
```
┌─────────────────────────────────────────────────────────┐
│  🕐 PersonaHub Time Machine                   [⟳ Refresh]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ● Current State                           [Save Now]    │
│  │                                                       │
│  ○ #5 · Feb 16, 08:46                                   │
│  │   "Added humor trait"                                │
│  │   5 files · 12.3 KB                                  │
│  │                                                       │
│  ○ #4 · Feb 15, 06:00  🕐                               │
│  │   "Auto-snapshot"                                    │
│  │   5 files · 11.8 KB                                  │
│  │                                                       │
│  ○ #3 · Feb 14, 06:00  🕐                               │
│      "Auto-snapshot"                                    │
│      4 files · 10.2 KB                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Technical Notes
- Fetch data from /api/snapshots
- Use CSS for timeline styling
- Show relative times for recent snapshots

### Estimate
- Dev: 2 hours
- Test: 1 hour

---

## Story 3.3: Snapshot Details & File Preview

**As a** developer,
**I want to** view files in a selected snapshot,
**So that** I can see what was in that version.

### Acceptance Criteria

**Given** A snapshot is selected in the timeline
**When** I view the detail panel
**Then** I see:
  - Snapshot ID, date, and message
  - List of all files in that snapshot
  - File sizes

**Given** I click on a file
**When** The file is selected
**Then** I see the file contents in a preview pane
**And** Syntax highlighting for markdown/code files

### UI Wireframe
```
┌───────────────────────────────────────────────────┐
│  Snapshot #5 - Feb 16, 08:46                      │
│  "Added humor trait"                              │
├───────────────────────────────────────────────────┤
│                                                   │
│  Files (5)                                        │
│  ──────────────────                               │
│  📄 SOUL.md          2.3 KB    [View]             │
│  📄 MEMORY.md       15.1 KB    [View]             │
│  📄 TOOLS.md         4.2 KB    [View]             │
│  📄 USER.md          1.1 KB    [View]             │
│  📄 AGENTS.md        3.6 KB    [View]             │
│                                                   │
│  ─────────────────────────────────────────────    │
│  [Diff vs Current]     [Restore This Snapshot]   │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Technical Notes
- API: GET /api/snapshots/:id/files
- API: GET /api/snapshots/:id/file/:path
- Use markdown renderer for .md files

### Estimate
- Dev: 2 hours
- Test: 1 hour

---

## Story 3.4: Visual Diff & Restore

**As a** developer,
**I want to** see diffs and restore from the UI,
**So that** I can make decisions without using CLI.

### Acceptance Criteria

**Given** I selected a snapshot
**When** I click "Diff vs Current"
**Then** I see a side-by-side or unified diff view:
  - Files added (green)
  - Files removed (red)
  - Files modified (yellow)
  - Line-level changes for each modified file

**Given** I click "Restore This Snapshot"
**When** The confirmation modal appears
**Then** I see:
  - Warning message
  - List of files that will change
  - "Cancel" and "Restore" buttons

**Given** I click "Restore" in the modal
**When** Restore completes
**Then** Success message is shown
**And** Timeline refreshes to show new backup snapshot
**And** Page indicates "Restored to #X"

### UI Wireframe - Diff View
```
┌─────────────────────────────────────────────────────────┐
│  Diff: Snapshot #3 → Current                   [Close]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Changes Summary: +2 files, ~1 modified                 │
│                                                          │
│  + memory/2026-02-15.md (new)                           │
│  + memory/2026-02-16.md (new)                           │
│  ~ SOUL.md                                              │
│                                                          │
│  ─── SOUL.md ───────────────────────────────────────    │
│  │ - Be helpful                    Be helpful        │  │
│  │ - Be concise                    Be concise        │  │
│  │                               + Have humor        │  │
│  │                               + Use emoji         │  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Technical Notes
- API: POST /api/restore/:id
- Use diff2html or similar for nice diff rendering
- Show loading state during restore

### Estimate
- Dev: 3 hours
- Test: 1.5 hours
