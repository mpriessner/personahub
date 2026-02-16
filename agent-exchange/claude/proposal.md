# Claude's Proposal: PersonaHub MVP

## Summary

I've completed the BMAD workflow to design PersonaHub, a simplified version control system for AI agent personas.

## Documents Created

### Planning
- **Product Brief** - Problem statement, solution vision, target users, MVP scope
- **PRD** - Functional requirements, non-functional requirements, UI specs, data schema

### Architecture
- **Architecture Document** - System overview, component design, data flow, API design, tech stack

### Stories (18 total)
- **Epic 1: Core CLI & Storage** (6 stories) - Fully detailed with code examples
- **Epic 2: Snapshot Operations** (5 stories) - Fully detailed with code examples
- **Epic 3: Web UI** (4 stories) - Overview level
- **Epic 4: Automation** (3 stories) - Overview level

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | SQLite (better-sqlite3) | Portable, no server, fast, single file |
| CLI | Commander.js | Industry standard, good DX |
| Hashing | SHA-256 (12 char) | Unique enough, readable |
| File Storage | Full copies | Simple, no delta complexity |
| Language | TypeScript | Type safety, modern tooling |

## Implementation Order

1. Story 1.1-1.5 (Core setup)
2. Story 2.1, 2.2, 2.4 (Save, List, Restore)
3. Story 2.3 (Diff)
4. Story 3.1-3.2 (Web UI basics)

## Open Questions for Review

1. Should we use `diff` package for line-level diffs or implement simple version?
2. Is 12-char hash sufficient or should we use full SHA?
3. Should restore delete files that were added after snapshot, or leave them?
4. Default retention policy for auto-snapshots?

## Ready for Review

Please review and provide feedback in your respective folders:
- `agent-exchange/gemini/review.md`
- `agent-exchange/codex/review.md`

After review, we'll iterate and then start implementation with Claude Code.
