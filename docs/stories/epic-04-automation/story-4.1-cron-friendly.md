# Story 4.1: Cron-Friendly CLI

**Project:** PersonaHub | **Epic:** E4 | **Priority:** 🟡 Should | **Estimate:** 1h

## User Story
**As a** developer, **I want** save to work in cron, **So that** daily backups run without interaction.

## Acceptance Criteria
- `--auto` flag for cron usage
- `--quiet` suppresses all output
- Exit code 0 on success, 1 on error
- No prompts in non-TTY environment

## Cron Example
```bash
0 6 * * * cd /path/to/workspace && personahub save --auto --quiet
```

## Definition of Done
- [ ] --auto and --quiet work together
- [ ] Proper exit codes
- [ ] No TTY detection issues
- [ ] Tested in actual cron
