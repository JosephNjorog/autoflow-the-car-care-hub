/**
 * Local development server — emulates Vercel serverless functions.
 * Runs on port 3000 so the Vite proxy (/api → localhost:3000) works unchanged.
 * Usage:  npm run dev:api   (or npm run dev:full for both at once)
 */

import http from 'http';
import { readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

// ---------------------------------------------------------------------------
// Load env files — same priority order as Vercel/Next: .env.local overrides .env
// ---------------------------------------------------------------------------
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) process.env[key] = val; // later file wins
    });
  console.log(`  Loaded ${path.basename(filePath)}`);
}

loadEnvFile(path.resolve('.env'));
loadEnvFile(path.resolve('.env.local')); // overrides .env

// ---------------------------------------------------------------------------
// Route discovery
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

type Handler = (req: any, res: any) => Promise<void>;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
  isDynamic: boolean;
  label: string;
}

const routes: Route[] = [];

async function loadRoutes() {
  const apiDir = path.join(__dirname, 'api');

  async function walk(dir: string, urlPrefix = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_'));
    const files = entries.filter(e => !e.isDirectory() && e.name.endsWith('.ts'));

    for (const entry of files) {
      const fullPath = path.join(dir, entry.name);
      const routeName = entry.name.slice(0, -3); // strip .ts
      const routePath = routeName === 'index' ? urlPrefix : `${urlPrefix}/${routeName}`;

      const paramNames: string[] = [];
      const patternStr = routePath.replace(/\[([^\]]+)\]/g, (_, p) => {
        paramNames.push(p);
        return '([^/]+)';
      });

      const mod = await import(fullPath);
      const handler: Handler = mod.default;

      routes.push({
        pattern: new RegExp(`^/api${patternStr}$`),
        paramNames,
        handler,
        isDynamic: paramNames.length > 0,
        label: `/api${routePath}`,
      });
    }

    for (const entry of dirs) {
      await walk(path.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
    }
  }

  await walk(apiDir);

  // Static routes must be matched before dynamic ones
  routes.sort((a, b) => Number(a.isDynamic) - Number(b.isDynamic));

  console.log(`  Registered ${routes.length} API routes`);
}

// ---------------------------------------------------------------------------
// Vercel-compatible response wrapper
// (Express-like helpers that Vercel handlers call: .status(), .json(), etc.)
// ---------------------------------------------------------------------------
function wrapRes(res: ServerResponse) {
  const w = res as any;
  if (w.__wrapped) return w;
  w.__wrapped = true;

  w.status = (code: number) => {
    res.statusCode = code;
    return w;
  };

  w.json = (data: unknown) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    }
    return w;
  };

  w.send = (data: unknown) => {
    if (typeof data === 'object' && data !== null) return w.json(data);
    if (!res.headersSent) res.end(String(data));
    return w;
  };

  // Some handlers call res.end() directly
  const origEnd = res.end.bind(res);
  w.end = (...args: Parameters<typeof res.end>) => {
    origEnd(...args);
    return w;
  };

  return w;
}

// ---------------------------------------------------------------------------
// Body parser (JSON)
// ---------------------------------------------------------------------------
function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', chunk => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
async function main() {
  console.log('\nAutoFlow local API server starting…\n');
  await loadRoutes();

  const server = http.createServer(async (req, res) => {
    const base = `http://localhost:${PORT}`;
    const url = new URL(req.url ?? '/', base);
    const pathname = url.pathname;

    // Query string params
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (query[k] = v));

    const wrappedRes = wrapRes(res);

    for (const route of routes) {
      const match = pathname.match(route.pattern);
      if (!match) continue;

      // Merge path params into query — Vercel puts them there (e.g. req.query.id)
      route.paramNames.forEach((p, i) => (query[p] = match[i + 1]));

      const body = await parseBody(req);
      const wrappedReq = Object.assign(req, { query, body, params: query });

      try {
        await route.handler(wrappedReq, wrappedRes);
      } catch (err) {
        console.error(`  ✗ [${req.method}] ${pathname}`, err);
        if (!res.headersSent) wrappedRes.status(500).json({ error: 'Internal server error' });
      }
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: `No handler: ${pathname}` }));
  });

  server.listen(PORT, () => {
    console.log(`\n  API server → http://localhost:${PORT}\n`);
  });
}

main().catch(err => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
