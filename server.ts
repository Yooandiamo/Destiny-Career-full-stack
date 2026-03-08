import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { createServer as createViteServer } from 'vite';
import { analyzeRouter } from './src/backend/api/analyze';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

async function bootstrap() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'destiny-career' });
  });

  app.use('/api/analyze', analyzeRouter());

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.resolve(root, 'dist/client');
    app.use(express.static(clientDist, { maxAge: '7d', index: false }));
    app.get('*', async (_req, res) => {
      const html = await fs.readFile(path.join(clientDist, 'index.html'), 'utf-8');
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    });
  } else {
    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const templatePath = path.resolve(root, 'index.html');
        let template = await fs.readFile(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Destiny Career server running at http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Server bootstrap failed:', error);
  process.exit(1);
});
