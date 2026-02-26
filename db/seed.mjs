/**
 * AutoFlow — Database reset & seed script
 *
 * Uses psql (PostgreSQL client) to apply schema + seed data.
 * Make sure psql is installed and .env.local has DATABASE_URL set.
 *
 * Usage:
 *   npm run seed
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Load .env.local ──────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  try {
    const lines = readFileSync(join(ROOT, '.env.local'), 'utf-8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
    console.log('📄 Loaded .env.local');
  } catch {
    // no .env.local — rely on environment
  }
}

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error('❌  DATABASE_URL is not set. Add it to .env.local or export it.');
  process.exit(1);
}

// ── Run a SQL file via psql ──────────────────────────────────────────────────
function runFile(label, filePath) {
  console.log(`\n▶  Running ${label}...`);
  try {
    const output = execSync(`psql "${DB}" -f "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = output.trim().split('\n').filter(Boolean);
    lines.forEach(l => console.log(`   ${l}`));
    console.log(`   ✅ Done`);
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || '').trim();
    console.error(`   ❌ Error:\n${msg}`);
    process.exit(1);
  }
}

console.log('🚗  AutoFlow — Database reset & seed\n');

runFile('schema.sql', join(__dirname, 'schema.sql'));
runFile('seed.sql',   join(__dirname, 'seed.sql'));

console.log('\n🎉  Database ready! Seeded accounts:');
console.log('   admin@autoflow.com   →  SuperAdmin123!  (admin)');
console.log('   owner@autoflow.com   →  Owner123!       (owner)');
console.log('   james@autoflow.com   →  Detailer123!    (detailer)');
console.log('   grace@autoflow.com   →  Detailer123!    (detailer)');
console.log('   john@autoflow.com    →  Customer123!    (customer)');
console.log('   mary@autoflow.com    →  Customer123!    (customer)');