import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { PersonaHubEngine } from '../core/engine';

export interface ServerOptions {
  port: number;
  open: boolean;
  workDir: string;
}

export async function startServer(options: ServerOptions): Promise<void> {
  const app = express();
  const engine = new PersonaHubEngine(options.workDir);
  
  // Ensure PersonaHub is initialized
  engine.ensureInitialized();
  
  app.use(express.json());
  
  // Try multiple paths for public folder (dev vs installed)
  const publicPaths = [
    path.join(__dirname, 'public'),                    // dist/ui/public
    path.join(__dirname, '..', '..', 'src', 'ui', 'public')  // src/ui/public (dev)
  ];
  
  const publicDir = publicPaths.find(p => fs.existsSync(p)) || publicPaths[0];
  app.use(express.static(publicDir));
  
  // API routes
  app.get('/api/snapshots', async (req, res) => {
    try {
      const snapshots = await engine.listSnapshots();
      res.json({ snapshots });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/snapshots/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid snapshot ID' });
      }
      const snapshot = await engine.getSnapshot(id);
      if (!snapshot) {
        return res.status(404).json({ error: 'Snapshot not found' });
      }
      res.json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/diff/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid snapshot ID' });
      }
      const diff = await engine.diff(id);
      res.json(diff);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/diff/:id/:id2', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const id2 = parseInt(req.params.id2, 10);
      if (isNaN(id) || isNaN(id2)) {
        return res.status(400).json({ error: 'Invalid snapshot IDs' });
      }
      const diff = await engine.diff(id, id2);
      res.json(diff);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/restore/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid snapshot ID' });
      }
      const result = await engine.restore(id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Start server
  return new Promise((resolve) => {
    const server = app.listen(options.port, async () => {
      console.log(`🕐 Time Machine UI running at http://localhost:${options.port}`);
      
      if (options.open) {
        try {
          const open = (await import('open')).default;
          await open(`http://localhost:${options.port}`);
        } catch (err) {
          // Ignore if can't open browser
        }
      }
      
      resolve();
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down...');
      server.close(() => process.exit(0));
    });
  });
}
