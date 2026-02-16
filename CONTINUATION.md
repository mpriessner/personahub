# PersonaHub - Continuation File

**Datum:** 2026-02-16  
**Status:** Pausiert (MVP funktionsfähig)  
**Repository:** https://github.com/mpriessner/personahub

---

## 🎯 Was ist PersonaHub?

**Simplified version control for AI agent personas** - Ein CLI-Tool das automatische Snapshots von Agent-Konfigurationen erstellt (SOUL.md, MEMORY.md, etc.) und einfaches Zurückrollen ermöglicht.

**Kernfeatures:**
- `personahub save` - Snapshot erstellen
- `personahub list` - Timeline anzeigen
- `personahub diff` - Änderungen vergleichen
- `personahub restore` - Zurückrollen (mit automatischem Backup)
- `personahub serve` - Web UI (Time Machine Style)
- `personahub cleanup` - Alte Snapshots löschen

---

## 📊 Aktueller Status

### Epics Übersicht

| Epic | Stories | Status | Notizen |
|------|---------|--------|---------|
| E1: Core CLI & Storage | 6/6 | ✅ Complete | SQLite via sql.js (pure JS) |
| E2: Snapshot Operations | 5/5 | ✅ Complete | save/list/diff/restore |
| E3: Web UI | 1/4 | 🔄 Partial | Server läuft, UI basic |
| E4: Automation | 3/3 | ✅ Complete | Cron-ready, Retention |

### Tests

```
82 Tests passing
- 55 Unit Tests (database, config, files)
- 27 Integration Tests (full workflow)
```

### Was funktioniert

1. **CLI komplett funktionsfähig**
   - Alle Commands implementiert
   - `--auto`, `--quiet`, `--skip-unchanged` für Cron
   - `--cleanup` für automatisches Aufräumen

2. **Web UI (basic)**
   - Server startet auf Port 3000
   - Dark Theme (GitHub-Style)
   - Timeline, Diff-Ansicht, Restore

3. **In ~/clawd installiert**
   - Erster Snapshot existiert (133 files)
   - Cron Job läuft alle 6h

---

## 🔧 Technische Details

### Stack
- **Language:** TypeScript
- **Database:** sql.js (SQLite in pure JS, kein native compile nötig)
- **CLI:** Commander.js
- **Web:** Express + Vanilla JS
- **Tests:** Jest + ts-jest

### Wichtige Dateien

```
src/
├── cli.ts                 # Entry point
├── commands/              # CLI commands
│   ├── init.ts
│   ├── save.ts
│   ├── list.ts
│   ├── diff.ts
│   ├── restore.ts
│   ├── serve.ts
│   └── cleanup.ts
├── core/
│   ├── engine.ts          # Hauptlogik (695 lines)
│   ├── config.ts          # Config mit Retention
│   └── types.ts
├── storage/
│   ├── database.ts        # sql.js wrapper
│   └── files.ts           # File ops + path validation
└── ui/
    ├── server.ts          # Express server
    └── public/            # Static files (HTML/CSS/JS)
```

### Konfiguration

```json
// .personahub/config.json
{
  "version": 1,
  "include": ["**/*.md", "**/*.yaml", "**/*.yml", "**/*.json", "**/*.txt"],
  "exclude": [".personahub/**", "node_modules/**", ".git/**", ...],
  "retention": {
    "autoSnapshotDays": 7,
    "manualSnapshotDays": 30,
    "minSnapshots": 5
  }
}
```

---

## ⏳ Was noch offen ist

### Epic 3: Web UI (Stories 3.2-3.4)

| Story | Beschreibung | Aufwand |
|-------|--------------|---------|
| 3.2 | Timeline View verbessern | 1h |
| 3.3 | Snapshot Details (Dateiliste) | 1h |
| 3.4 | Visual Diff & One-Click Restore | 2h |

### Nice-to-Have (nicht geplant)

- [ ] File-level restore (einzelne Dateien)
- [ ] Branches/Tags
- [ ] Remote sync (GitHub/S3)
- [ ] VS Code Extension
- [ ] Diff zwischen beliebigen Snapshots im Web UI

---

## 🚀 Weitermachen

### Schnellstart

```bash
cd /home/martin/coding_projects/PersonaHub
npm install
npm run build
npm test  # 82 tests should pass

# CLI testen
personahub --help
cd ~/clawd
personahub list
```

### Nächste Schritte (Empfehlung)

1. **Story 3.2-3.4** fertig machen (Web UI polish) - ~4h
2. **Oder:** Projekt als "MVP done" betrachten und nutzen

### Cron Job Status

```
Name: PersonaHub Auto-Snapshot
Schedule: 0 */6 * * * (alle 6h)
Command: personahub save --auto --skip-unchanged --cleanup --quiet
Status: Aktiv
```

---

## 📝 Bekannte Issues / Learnings

1. **sql.js statt better-sqlite3**
   - Grund: Native compilation failed in WSL
   - Lösung: Pure JS implementation (etwas langsamer, aber funktioniert überall)

2. **Glob Pattern `**/*.md`**
   - Ursprünglich war es `*.md` (nur root level)
   - Gefixt für nested directories

3. **Duplicate Hash Handling**
   - Wenn current state = existing snapshot → wird recycled statt Fehler

---

## 🔗 Links

- **GitHub:** https://github.com/mpriessner/personahub
- **Docs:** `/home/martin/coding_projects/PersonaHub/docs/`
- **Stories:** `/home/martin/coding_projects/PersonaHub/docs/stories/`

---

## 💡 Context für AI Agent

Wenn du (als AI Agent) dieses Projekt fortsetzt:

1. Lies zuerst `docs/stories/README.md` für Epic-Übersicht
2. Die offenen Stories sind in `docs/stories/epic-03-web-ui/`
3. Alle Tests müssen grün bleiben: `npm test`
4. Build: `npm run build` (kopiert auch public/ nach dist/)
5. PersonaHub ist bereits in `~/clawd` aktiv - vorsichtig mit Breaking Changes!

**Hauptdatei zum Verstehen:** `src/core/engine.ts` - enthält die gesamte Snapshot-Logik.
