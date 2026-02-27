import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

function mapLocation(l: Record<string, unknown>) {
  return {
    id: l.id, ownerId: l.owner_id,
    name: l.name, address: l.address, city: l.city,
    lat: l.lat, lng: l.lng, isActive: l.is_active,
    createdAt: l.created_at,
  };
}

// ── GET/POST /api/locations ───────────────────────────────────────────────────
async function handleIndex(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { ownerId, activeOnly } = req.query;
    let locations;
    if (ownerId) {
      locations = await sql`
        SELECT l.*, u.first_name || ' ' || u.last_name as owner_name, u.wallet_address as owner_wallet_address
        FROM locations l JOIN users u ON u.id = l.owner_id
        WHERE l.owner_id = ${ownerId as string} ORDER BY l.name
      `;
    } else if (activeOnly !== 'false') {
      locations = await sql`
        SELECT l.*, u.first_name || ' ' || u.last_name as owner_name, u.wallet_address as owner_wallet_address
        FROM locations l JOIN users u ON u.id = l.owner_id
        WHERE l.is_active = true ORDER BY l.city, l.name
      `;
    } else {
      const auth = requireAuth(req, res);
      if (!auth || auth.role !== 'admin') return;
      locations = await sql`
        SELECT l.*, u.first_name || ' ' || u.last_name as owner_name, u.wallet_address as owner_wallet_address
        FROM locations l JOIN users u ON u.id = l.owner_id ORDER BY l.city, l.name
      `;
    }
    return res.status(200).json(locations.map(l => ({ ...mapLocation(l), ownerName: l.owner_name, ownerWalletAddress: l.owner_wallet_address || null })));
  }

  if (req.method === 'POST') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (!['owner', 'admin'].includes(auth.role)) return res.status(403).json({ error: 'Only owners can create locations' });
    const { name, address, city, lat, lng } = req.body;
    if (!name || !address) return res.status(400).json({ error: 'Name and address are required' });
    const ownerId = auth.role === 'admin' ? (req.body.ownerId || auth.userId) : auth.userId;
    const [location] = await sql`
      INSERT INTO locations (owner_id, name, address, city, lat, lng)
      VALUES (${ownerId}, ${name}, ${address}, ${city || 'Nairobi'}, ${lat || null}, ${lng || null})
      RETURNING *
    `;
    return res.status(201).json(mapLocation(location));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── GET/PATCH/PUT/DELETE /api/locations/:id ───────────────────────────────────
async function handleById(req: VercelRequest, res: VercelResponse, id: string) {
  if (req.method === 'GET') {
    const [loc] = await sql`SELECT * FROM locations WHERE id = ${id}`;
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    return res.status(200).json({ id: loc.id, ownerId: loc.owner_id, name: loc.name, address: loc.address, city: loc.city, lat: loc.lat, lng: loc.lng, isActive: loc.is_active });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;
  const [loc] = await sql`SELECT owner_id FROM locations WHERE id = ${id}`;
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  if (auth.role !== 'admin' && loc.owner_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { name, address, city, lat, lng, isActive } = req.body;
    const [updated] = await sql`
      UPDATE locations SET
        name = COALESCE(${name || null}, name),
        address = COALESCE(${address || null}, address),
        city = COALESCE(${city || null}, city),
        lat = COALESCE(${lat ?? null}, lat),
        lng = COALESCE(${lng ?? null}, lng),
        is_active = COALESCE(${isActive ?? null}, is_active)
      WHERE id = ${id} RETURNING *
    `;
    return res.status(200).json({ id: updated.id, ownerId: updated.owner_id, name: updated.name, address: updated.address, city: updated.city, lat: updated.lat, lng: updated.lng, isActive: updated.is_active });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM locations WHERE id = ${id}`;
    return res.status(200).json({ message: 'Location deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');
  if (slug.length === 0 || route === "index") return handleIndex(req, res);
  if (slug.length === 1) return handleById(req, res, slug[0]);
  return res.status(404).json({ error: 'Not found' });
}
