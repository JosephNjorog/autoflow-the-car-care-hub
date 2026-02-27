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

// ── GET/POST /api/services ────────────────────────────────────────────────────
async function handleIndex(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { ownerId: ownerIdParam, locationId, activeOnly } = req.query;
    const onlyActive = activeOnly !== 'false';
    let services;

    if (locationId) {
      // Customer view: services for a specific location (joined via owner_id)
      // Only return active services and active locations
      if (onlyActive) {
        services = await sql`
          SELECT s.* FROM services s
          INNER JOIN locations l ON l.owner_id = s.owner_id
          WHERE l.id = ${locationId as string}
            AND l.is_active = true
            AND s.is_active = true
          ORDER BY s.category, s.price
        `;
      } else {
        services = await sql`
          SELECT s.* FROM services s
          INNER JOIN locations l ON l.owner_id = s.owner_id
          WHERE l.id = ${locationId as string}
          ORDER BY s.category, s.price
        `;
      }
    } else if (ownerIdParam) {
      // Owner dashboard: all services for a specific owner (active + inactive)
      services = await sql`
        SELECT * FROM services
        WHERE owner_id = ${ownerIdParam as string}
        ORDER BY category, price
      `;
    } else {
      // Public listing: only active services
      services = await sql`
        SELECT * FROM services WHERE is_active = true ORDER BY category, price
      `;
    }
    return res.status(200).json(services.map(mapService));
  }

  if (req.method === 'POST') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (!['owner', 'admin'].includes(auth.role)) return res.status(403).json({ error: 'Only owners can create services' });
    const { name, description, price, duration, category, imageUrl } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ error: 'Name, price, and duration are required' });
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

// ── GET/PATCH/PUT/DELETE /api/services/:id ───────────────────────────────────
async function handleById(req: VercelRequest, res: VercelResponse, id: string) {
  if (req.method === 'GET') {
    const [service] = await sql`SELECT * FROM services WHERE id = ${id}`;
    if (!service) return res.status(404).json({ error: 'Service not found' });
    return res.status(200).json({ id: service.id, ownerId: service.owner_id, name: service.name, description: service.description, price: parseFloat(service.price), duration: service.duration, category: service.category, imageUrl: service.image_url, isActive: service.is_active, createdAt: service.created_at });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;
  const [service] = await sql`SELECT owner_id FROM services WHERE id = ${id}`;
  if (!service) return res.status(404).json({ error: 'Service not found' });
  if (auth.role !== 'admin' && service.owner_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { name, description, price, duration, category, imageUrl, isActive } = req.body;
    const [updated] = await sql`
      UPDATE services SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        price = COALESCE(${price || null}, price),
        duration = COALESCE(${duration || null}, duration),
        category = COALESCE(${category || null}, category),
        image_url = COALESCE(${imageUrl || null}, image_url),
        is_active = COALESCE(${isActive ?? null}, is_active)
      WHERE id = ${id} RETURNING *
    `;
    return res.status(200).json({ id: updated.id, ownerId: updated.owner_id, name: updated.name, description: updated.description, price: parseFloat(updated.price), duration: updated.duration, category: updated.category, imageUrl: updated.image_url, isActive: updated.is_active });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM services WHERE id = ${id}`;
    return res.status(200).json({ message: 'Service deleted' });
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
