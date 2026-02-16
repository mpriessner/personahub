---
document: Product Brief
project: PersonaHub
version: 1.0
date: 2026-02-16
author: Martin Priessner
status: Draft
---

# Product Brief: PersonaHub

## 1. Problem Statement

### The Core Problem
AI assistants with persistent personas (stored in files like SOUL.md, MEMORY.md, TOOLS.md) can accidentally overwrite their own configuration during operation. When an AI agent modifies these files incorrectly, the changes are **irreversible** without manual backup systems.

### Current Pain Points
- **No version history**: Changes to persona files have no audit trail
- **Irreversible mistakes**: A bad edit means manual recovery or data loss
- **Manual backups**: Users rely on ad-hoc file copies or git commits
- **No rollback**: Can't easily restore to "yesterday's personality"
- **No visibility**: Hard to see what changed over time

### Who Has This Problem?
- Developers building AI agents with persistent configurations
- Users of frameworks like Clawdbot, AutoGPT, Claude with custom personas
- Teams managing multiple AI agents with different personalities

## 2. Solution Vision

### One-Liner
> Time Machine for AI personas - automatic versioning with one-click restore.

### How It Works
1. **Initialize** PersonaHub in any workspace with persona files
2. **Automatic snapshots** run daily via cron (or manually triggered)
3. **Browse history** through CLI or visual Time Machine UI
4. **Restore** to any previous state with one command

### Key Differentiators vs Git
| Git | PersonaHub |
|-----|------------|
| 100+ commands | 6 commands |
| Staging area, branches, remotes | Direct snapshot |
| Developer-focused | AI-persona-focused |
| Text-based history | Visual timeline UI |
| Manual commits | Auto-snapshot via cron |

## 3. Target Users

### Primary: Solo AI Developers
- Building personal AI assistants
- Using Clawdbot, Claude, or similar frameworks
- Technical enough for CLI but want simplicity
- **Goal:** "Never lose my agent's personality again"

### Secondary: AI Agent Teams
- Managing multiple agents
- Need oversight of configuration changes
- Want audit trail for compliance
- **Goal:** "See who changed what, when"

## 4. MVP Scope

### In Scope (v0.1)
- ✅ CLI tool installable via npm
- ✅ `init`, `save`, `list`, `diff`, `restore` commands
- ✅ SQLite-based local storage
- ✅ Cron-compatible for automation
- ✅ Time Machine web UI (basic)

### Out of Scope (Future)
- ❌ Remote sync / cloud storage
- ❌ Branching / merging
- ❌ Multi-user collaboration
- ❌ Real-time file watching (daemon)
- ❌ Conflict resolution

## 5. Success Metrics

### MVP Success Criteria
- [ ] Can initialize in <5 seconds
- [ ] Snapshot creation <2 seconds for typical workspace
- [ ] Restore works correctly 100% of the time
- [ ] At least 1 daily auto-snapshot via cron for 30 days
- [ ] Successfully recovered from at least 1 "mistake"

### User Value Metrics
- Time saved vs manual backups
- Confidence level when letting AI modify its own files
- Number of successful restores

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Storage bloat (many snapshots) | Auto-cleanup old snapshots, deduplication |
| Restore corrupts files | Always create backup snapshot before restore |
| SQLite file gets corrupted | Regular integrity checks, recovery mode |
| User doesn't set up cron | Clear setup instructions, reminder prompts |

## 7. Timeline

### Phase 1: MVP (Today)
- Core CLI commands
- SQLite storage
- Basic Time Machine UI

### Phase 2: Polish (Week 2)
- Better diff visualization
- Snapshot comparison
- Auto-cleanup

### Phase 3: Extend (Month 1)
- Remote backup option
- Multiple workspace support
- Team features

## 8. Open Questions

1. **File format**: Store full copies or diffs? (Decision: Full copies for simplicity)
2. **Default include patterns**: What files to track by default?
3. **Snapshot retention**: How long to keep old snapshots?
4. **Naming**: "PersonaHub" or something else?

---

**Next:** PRD → Architecture → Epics & Stories → Implementation
