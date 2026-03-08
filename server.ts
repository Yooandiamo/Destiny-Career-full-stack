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

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateStore = new Map<string, RateBucket>();

function getClientIp(req: express.Request) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function parseAllowedOrigins() {
  const value = process.env.CORS_ORIGIN || '';
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = express();

  const allowedOrigins = parseAllowedOrigins();
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) {
      return next();
    }

    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      return next();
    }

    return res.status(403).json({ message: '跨域请求被拒绝' });
  });

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const maxReq = Number(process.env.RATE_LIMIT_MAX || 30);
  app.use('/api', (req, res, next) => {
    const key = `${getClientIp(req)}:${req.path}`;
    const now = Date.now();
    const current = rateStore.get(key);

    if (!current || current.resetAt <= now) {
      rateStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxReq) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
    }

    current.count += 1;
    rateStore.set(key, current);
    return next();
  });

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'destiny-career' });
  });

  app.use('/api/analyze', analyzeRouter());

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.resolve(root, 'dist/client');
    const indexPath = path.join(clientDist, 'index.html');
    const hasFrontendBundle = await fileExists(indexPath);

    if (hasFrontendBundle) {
      app.use(express.static(clientDist, { maxAge: '7d', index: false }));
      app.get('*', async (_req, res) => {
        const html = await fs.readFile(indexPath, 'utf-8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      });
    } else {
      app.get('/', (_req, res) => {
        res.json({
          ok: true,
          app: 'destiny-career',
          mode: 'api-only',
          message: 'Frontend bundle not found. API service is running.'
        });
      });
    }
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
