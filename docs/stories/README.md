# PersonaHub - Stories

## Overview

Individual story files for implementation. Each story is self-contained and can be given to an agent independently.

**Total:** 4 Epics, 18 Stories

## Epic Overview

| Epic | Folder | Stories | Priority |
|------|--------|---------|----------|
| E1 | [epic-01-core-cli/](./epic-01-core-cli/) | 6 | 🔴 Must |
| E2 | [epic-02-snapshots/](./epic-02-snapshots/) | 5 | 🔴 Must |
| E3 | [epic-03-web-ui/](./epic-03-web-ui/) | 4 | 🟡 Should |
| E4 | [epic-04-automation/](./epic-04-automation/) | 3 | 🟡 Should |

## Implementation Order

### Phase 1: MVP Core (Today)
1. `epic-01-core-cli/story-1.1-npm-package-setup.md`
2. `epic-01-core-cli/story-1.2-cli-framework.md`
3. `epic-01-core-cli/story-1.3-project-init.md`
4. `epic-01-core-cli/story-1.4-sqlite-schema.md`
5. `epic-01-core-cli/story-1.5-config-management.md`
6. `epic-02-snapshots/story-2.1-create-snapshot.md`
7. `epic-02-snapshots/story-2.2-list-snapshots.md`
8. `epic-02-snapshots/story-2.4-restore.md`

### Phase 2: Polish
9. `epic-02-snapshots/story-2.3-diff.md`
10. `epic-03-web-ui/story-3.1-web-server.md`
11. `epic-03-web-ui/story-3.2-timeline-view.md`

### Phase 3: Testing
12. `epic-01-core-cli/story-1.6-unit-tests.md`
13. `epic-02-snapshots/story-2.5-integration-tests.md`

### Phase 4: Automation
14. `epic-04-automation/story-4.1-cron-friendly.md`
15. `epic-04-automation/story-4.2-skip-unchanged.md`

### Phase 5: Advanced
16-18. Remaining stories

## Story Format

Each story file contains:
- **Context** - Project background, why this story matters
- **Dependencies** - What must be done first
- **User Story** - As a / I want / So that
- **Acceptance Criteria** - Gherkin format
- **Technical Implementation** - Code examples, file structure
- **Testing** - How to verify
- **Definition of Done** - Checklist

## For Agents

Each story is designed to be implementable without additional context. The story contains everything needed:
- Project overview
- Technical details
- Code examples
- Test cases

Just read the story and implement it.
