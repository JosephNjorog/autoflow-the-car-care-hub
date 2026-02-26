import { neon, neonConfig } from '@neondatabase/serverless';

// Some environments (e.g. local dev on machines where IPv6 is unreachable) fail to
// reach Neon's HTTP API with Node's native fetch. Forcing IPv4 via undici fixes this.
// undici is bundled with Node.js 18+ and safe to use on Vercel (which also supports IPv4).
try {
  const { Agent, fetch: undiciFetch } = await import('undici');
  const agent = new Agent({ connect: { family: 4 } as object });
  neonConfig.fetchFunction = (url: string, opts: RequestInit) =>
    (undiciFetch as unknown as typeof fetch)(url, { ...(opts as RequestInit), dispatcher: agent } as RequestInit);
} catch {
  // undici unavailable — fall back to native fetch (works on Vercel Edge runtime)
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const sql = neon(process.env.DATABASE_URL);
export default sql;

/**
 * Execute a pre-built SQL string that uses $1, $2, ... positional placeholders.
 * Neon's tagged-template driver doesn't expose .unsafe(), so we reconstruct
 * the template strings array from the query string and call sql() directly.
 *
 * Example:
 *   rawSql('SELECT * FROM users WHERE id = $1 AND role = $2', [userId, 'admin'])
 */
export function rawSql<T = Record<string, unknown>>(
  queryStr: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (params.length === 0) {
    // No parameters — pass as single-element strings array
    return (sql as unknown as (s: string[]) => Promise<T[]>)([queryStr]);
  }

  // Split the query string around each $N marker to build the template strings array.
  // Tagged template `sql\`...${v1}...${v2}...\`` === sql(['before1','between','after'], v1, v2)
  const parts: string[] = [];
  let remaining = queryStr;

  for (let i = 1; i <= params.length; i++) {
    const marker = `$${i}`;
    const idx = remaining.indexOf(marker);
    if (idx === -1) break;
    parts.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx + marker.length);
  }
  parts.push(remaining); // trailing fragment after last placeholder

  return (sql as unknown as (s: string[], ...v: unknown[]) => Promise<T[]>)(parts, ...params);
}