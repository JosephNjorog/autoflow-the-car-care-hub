import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const [loc] = await sql`SELECT * FROM locations WHERE id = ${id}`;
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    return res.status(200).json({
      id: loc.id, ownerId: loc.owner_id, name: loc.name,
      address: loc.address, city: loc.city, lat: loc.lat,
      lng: loc.lng, isActive: loc.is_active,
    });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  const [loc] = await sql`SELECT owner_id FROM locations WHERE id = ${id}`;
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  if (auth.role !== 'admin' && loc.owner_id !== auth.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

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
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json({
      id: updated.id, ownerId: updated.owner_id, name: updated.name,
      address: updated.address, city: updated.city, lat: updated.lat,
      lng: updated.lng, isActive: updated.is_active,
    });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM locations WHERE id = ${id}`;
    return res.status(200).json({ message: 'Location deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
