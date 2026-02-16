# PersonaHub - Research: Existing Solutions

**Date:** 2026-02-16
**Phase:** BMAD Analysis - Technical Research

---

## 🔍 Research Summary

### Version Control Alternatives (Simpler than Git)

| Tool | Type | Highlights | Relevance |
|------|------|------------|-----------|
| **jj (Jujutsu)** | Git-compatible VCS | Simpler CLI, Rust-based, automatic conflict handling | ⭐⭐⭐ High - could be base |
| **Mercurial** | DVCS | Simple, lightweight, fast | ⭐⭐ Medium |
| **Fossil** | All-in-one VCS | Single executable, SQLite-based, built-in wiki/tickets | ⭐⭐ Medium |

### AI Persona/Agent Version Control

| Tool | Description | Relevance |
|------|-------------|-----------|
| **Relevance AI** | Auto-versioning on save for agents & tools | ⭐⭐⭐ Concept inspiration |
| **memenow/persona-agent** | Framework with JSON/YAML persona configs | ⭐⭐ Config format inspiration |
| **Hyperleap Personas API** | 10+ versions per persona, model switching | ⭐⭐⭐ Feature inspiration |
| **Retell AI** | Published versions lock-in, draft system | ⭐⭐⭐ Workflow inspiration |
| **PromptLayer** | Version control for prompts & configs | ⭐⭐ Similar concept |

### Key Insights from Market

1. **Auto-versioning** is popular (save = new version)
2. **Draft vs Published** workflow is common
3. **Rollback capability** is essential
4. **Config as code** (YAML/JSON) is standard
5. **No single tool** does "simple Git for personas" - gap in market!

---

## 🎯 Build vs Buy Analysis

### Option A: Build from Scratch
**Pros:** Exactly what we need, no bloat, learning experience
**Cons:** More work, need to solve distributed sync

### Option B: Wrap jj/Jujutsu
**Pros:** Already simpler than Git, Git-compatible, battle-tested
**Cons:** Still complex, dependency

### Option C: Git Wrapper CLI
**Pros:** Familiar backend, persona-specific commands
**Cons:** Still Git underneath, complexity leak

### Option D: Simple Custom (Recommended)
**Pros:** 
- Content-addressable (like Git blobs)
- SQLite for metadata (like Fossil)
- Simple CLI ("persona commit/push/diff")
- REST API for remote sync
- No complex branching initially

---

## 📋 Recommended MVP Features

1. **Local Operations**
   - `persona init` - Create repo
   - `persona commit -m "message"` - Save version
   - `persona log` - View history
   - `persona diff` - Compare versions
   - `persona checkout <hash>` - Restore version

2. **Remote Sync** (Phase 2)
   - `persona remote add <url>`
   - `persona push`
   - `persona pull`

3. **Storage Format**
   - YAML/JSON personas in `personas/` folder
   - `.personahub/` metadata directory
   - SQLite for version history
   - Content-addressed blob storage

---

## Next Steps

→ Create Product Brief (BMAD 2-plan-workflows)
→ Define Epics & Stories (BMAD 3-solutioning)
→ Multi-agent review
