import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

function mapService(s: Record<string, unknown>) {
  return {
    id: s.id, ownerId: s.owner_id,
    name: s.name, description: s.description,
    price: parseFloat(s.price as string),
    duration: s.duration, category: s.category,
    imageUrl: s.image_url, isActive: s.is_active,
    createdAt: s.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    // Public endpoint — no auth required for browsing services
    const { ownerId, locationId, activeOnly } = req.query;

    let services;
    if (locationId) {
      // Services available at a specific location (by owner of that location)
      services = await sql`
        SELECT s.* FROM services s
        INNER JOIN locations l ON l.owner_id = s.owner_id
        WHERE l.id = ${locationId as string}
        AND (${activeOnly !== 'false'} = false OR s.is_active = true)
        ORDER BY s.category, s.price
      `;
    } else if (ownerId) {
      services = await sql`
        SELECT * FROM services WHERE owner_id = ${ownerId as string}
        ORDER BY category, price
      `;
    } else {
      services = await sql`
        SELECT * FROM services WHERE is_active = true
        ORDER BY category, price
      `;
    }

    return res.status(200).json(services.map(mapService));
  }

  if (req.method === 'POST') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (!['owner', 'admin'].includes(auth.role)) {
      return res.status(403).json({ error: 'Only owners can create services' });
    }

    const { name, description, price, duration, category, imageUrl } = req.body;
    if (!name || !price || !duration) {
      return res.status(400).json({ error: 'Name, price, and duration are required' });
    }

    const ownerId = auth.role === 'admin' ? (req.body.ownerId || auth.userId) : auth.userId;

    const [service] = await sql`
      INSERT INTO services (owner_id, name, description, price, duration, category, image_url)
      VALUES (${ownerId}, ${name}, ${description || null}, ${price}, ${duration}, ${category || 'Basic'}, ${imageUrl || null})
      RETURNING *
    `;

    return res.status(201).json(mapService(service));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
