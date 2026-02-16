# PersonaHub - Epics & Stories

## Overview

This document provides the complete epic and story breakdown for PersonaHub MVP.

**Total:** 4 Epics, 18 Stories

## Epic Summary

| Epic | Title | Stories | Priority | Status |
|------|-------|---------|----------|--------|
| [E1](./epic-01-core-cli-storage.md) | Core CLI & Storage | 6 | 🔴 Must | Draft |
| [E2](./epic-02-snapshot-operations.md) | Snapshot Operations | 5 | 🔴 Must | Draft |
| [E3](./epic-03-time-machine-ui.md) | Time Machine Web UI | 4 | 🟡 Should | Draft |
| [E4](./epic-04-cron-automation.md) | Cron & Automation | 3 | 🟡 Should | Draft |

## Story List

### Epic 1: Core CLI & Storage
- 1.1 NPM Package Setup
- 1.2 CLI Framework Setup
- 1.3 Project Initialization
- 1.4 SQLite Schema Design
- 1.5 Config Management
- 1.6 Unit Tests - Core Storage

### Epic 2: Snapshot Operations
- 2.1 Create Snapshot
- 2.2 List Snapshots (Timeline)
- 2.3 Diff Between Versions
- 2.4 Restore Snapshot
- 2.5 Integration & E2E Tests - Snapshots

### Epic 3: Time Machine Web UI
- 3.1 Start Web Server
- 3.2 Timeline View
- 3.3 Snapshot Details & File Preview
- 3.4 Visual Diff & Restore

### Epic 4: Cron & Automation
- 4.1 Cron-Friendly CLI
- 4.2 Skip Unchanged
- 4.3 Retention & Cleanup

## Implementation Order (Recommended)

### Phase 1: MVP Core (Today)
1. ✅ E1: Story 1.1 - NPM Package Setup
2. ✅ E1: Story 1.2 - CLI Framework Setup
3. ✅ E1: Story 1.3 - Project Initialization
4. ✅ E1: Story 1.4 - SQLite Schema Design
5. ✅ E1: Story 1.5 - Config Management
6. ✅ E2: Story 2.1 - Create Snapshot
7. ✅ E2: Story 2.2 - List Snapshots
8. ✅ E2: Story 2.4 - Restore Snapshot

### Phase 2: Polish (Today Stretch)
9. E2: Story 2.3 - Diff Between Versions
10. E3: Story 3.1 - Start Web Server
11. E3: Story 3.2 - Timeline View

### Phase 3: Testing
12. E1: Story 1.6 - Unit Tests
13. E2: Story 2.5 - Integration Tests

### Phase 4: Automation
14. E4: Story 4.1 - Cron-Friendly CLI
15. E4: Story 4.2 - Skip Unchanged

### Phase 5: Advanced UI
16. E3: Story 3.3 - File Preview
17. E3: Story 3.4 - Visual Diff & Restore

### Phase 6: Maintenance
18. E4: Story 4.3 - Retention & Cleanup

## Test Coverage Goals

| Module | Target |
|--------|--------|
| Core Engine | 80% |
| Storage | 90% |
| Commands | 80% |
| UI API | 70% |

## Definition of Done

- [ ] Code implemented and working
- [ ] Unit tests passing
- [ ] Integration tests passing (where applicable)
- [ ] CLI help text updated
- [ ] README documentation updated
- [ ] Code reviewed (multi-agent review)
