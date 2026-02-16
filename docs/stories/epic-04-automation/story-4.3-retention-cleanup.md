# Story 4.3: Retention & Cleanup

**Project:** PersonaHub | **Epic:** E4 | **Priority:** 🟢 Could | **Estimate:** 2h

## User Story
**As a** developer, **I want** old snapshots cleaned up, **So that** storage doesn't grow unbounded.

## Acceptance Criteria
- Config: `retention.autoSnapshotDays`
- Config: `retention.minSnapshots`
- `personahub cleanup` command
- `--cleanup` flag on save

## Definition of Done
- [ ] Retention config respected
- [ ] Cleanup deletes old snapshots
- [ ] minSnapshots always kept
- [ ] Manual snapshots kept longer
