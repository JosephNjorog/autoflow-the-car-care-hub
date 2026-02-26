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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    // Public — for booking browse
    const { ownerId, activeOnly } = req.query;
    let locations;
    if (ownerId) {
      locations = await sql`
        SELECT l.*, u.first_name || ' ' || u.last_name as owner_name
        FROM locations l JOIN users u ON u.id = l.owner_id
        WHERE l.owner_id = ${ownerId as string}
        ORDER BY l.name
      `;
    } else if (activeOnly !== 'false') {
      locations = await sql`
        SELECT l.*, u.first_name || ' ' || u.last_name as owner_name
        FROM locations l JOIN users u ON u.id = l.owner_id
        WHERE l.is_active = true
        ORDER BY l.city, l.name
      `;
    } else {
      // Admin: all locations
      const auth = requireAuth(req, res);
      if (!auth || auth.role !== 'admin') return;
      locations = await sql`
        SELECT l.*, u.first_name || ' ' || u.last_name as owner_name
        FROM locations l JOIN users u ON u.id = l.owner_id
        ORDER BY l.city, l.name
      `;
    }

    return res.status(200).json(locations.map(l => ({
      ...mapLocation(l), ownerName: l.owner_name,
    })));
  }

  if (req.method === 'POST') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (!['owner', 'admin'].includes(auth.role)) {
      return res.status(403).json({ error: 'Only owners can create locations' });
    }

    const { name, address, city, lat, lng } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

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
