import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getDBStatus } from './backend/config/db.ts';
import { errorHandler } from './backend/middleware/errorHandler.ts';
import taskRoutes from './backend/routes/taskRoutes.ts';
import { getJsonTaskCount } from './backend/storage/taskStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req: Request, res: Response) => {
    const status = getDBStatus();
    if (!status.connected && status.configured) {
      await connectDB();
    }
    const latest = getDBStatus();
    const jsonTaskCount = await getJsonTaskCount();
    const storageMode = latest.connected ? 'mongodb' : 'json';
    res.status(200).json({
      success: true,
      service: 'TaskFlow API',
      storageMode,
      jsonTaskCount,
      database: {
        connected: latest.connected,
        configured: latest.configured,
        placeholderDetected: latest.placeholderDetected,
        state: latest.connected
          ? latest.stateLabel
          : !latest.configured
          ? 'JSON File Store (backend/data/tasks.json)'
          : latest.stateLabel,
        dbName: latest.dbName,
        error: latest.lastError,
      },
    });
  });

  app.use('/api/tasks', taskRoutes);

  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'API route not found.',
    });
  });

  app.use(errorHandler);

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return app;
}

async function startServer() {
  await connectDB();
  const app = await createApp();
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(`[TaskFlow] Server listening on http://0.0.0.0:${port}`);
  });
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
