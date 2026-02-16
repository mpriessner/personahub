# Story 3.1: Start Web Server

## Context

**Project:** PersonaHub  
**Epic:** E3 - Time Machine Web UI  
**Story:** 3.1 - Web Server  
**Priority:** 🟡 Should  
**Estimate:** 1 hour  

---

## Dependencies

**Requires:** Epic 2 complete  
**Blocks:** Stories 3.2, 3.3, 3.4

---

## User Story

**As a** developer,  
**I want to** run `personahub serve` to start the UI,  
**So that** I can visually browse my snapshot history.

---

## Acceptance Criteria

### AC1: Server starts
```gherkin
When I run `personahub serve`
Then server starts on port 3000
And I see "🕐 Time Machine UI running at http://localhost:3000"
```

### AC2: Port configuration
```gherkin
When I run `personahub serve --port 8080`
Then server starts on port 8080
```

### AC3: Auto-open browser
```gherkin
Given default options
When server starts
Then browser opens automatically
```

### AC4: API endpoints available
```
GET /api/snapshots        → list snapshots
GET /api/snapshots/:id    → snapshot details
GET /api/diff/:id         → diff vs current
POST /api/restore/:id     → restore snapshot
```

---

## Technical Implementation

### File Structure

```
src/
└── ui/
    ├── server.ts         # Express server
    └── public/
        ├── index.html
        ├── app.js
        └── style.css
```

### src/ui/server.ts

```typescript
import express from 'express';
import * as path from 'path';
import * as open from 'open';
import { PersonaHubEngine } from '../core/engine';

export function startServer(options: { port: number; open: boolean; workDir: string }) {
  const app = express();
  const engine = new PersonaHubEngine(options.workDir);
  
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  
  // API routes
  app.get('/api/snapshots', (req, res) => {
    const snapshots = engine.listSnapshots();
    res.json({ snapshots });
  });
  
  app.get('/api/snapshots/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const snapshot = engine.getSnapshot(id);
    if (!snapshot) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(snapshot);
  });
  
  app.get('/api/diff/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const diff = engine.diff(id);
    res.json(diff);
  });
  
  app.post('/api/restore/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = engine.restore(id);
    res.json(result);
  });
  
  app.listen(options.port, () => {
    console.log(`🕐 Time Machine UI running at http://localhost:${options.port}`);
    if (options.open) {
      open(`http://localhost:${options.port}`);
    }
  });
}
```

---

## Definition of Done

- [ ] Express server starts on configured port
- [ ] Static files served from public/
- [ ] API endpoints return JSON
- [ ] Browser opens automatically
- [ ] `--no-open` prevents auto-open
- [ ] `--port` configures port
- [ ] Code committed to git
