# Story 4.2: Skip Unchanged

**Project:** PersonaHub | **Epic:** E4 | **Priority:** 🟡 Should | **Estimate:** 1.5h

## User Story
**As a** developer, **I want** to skip snapshots if nothing changed, **So that** I don't waste storage.

## Acceptance Criteria
- `--skip-unchanged` flag
- Compares file hashes with last snapshot
- Exit code 0 (not error) when skipping
- Message "No changes detected"

## Definition of Done
- [ ] Hash comparison works
- [ ] Skips correctly when unchanged
- [ ] Creates snapshot when changed
- [ ] Works with --auto
