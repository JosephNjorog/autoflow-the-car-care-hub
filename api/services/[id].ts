import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const [service] = await sql`SELECT * FROM services WHERE id = ${id}`;
    if (!service) return res.status(404).json({ error: 'Service not found' });
    return res.status(200).json({
      id: service.id, ownerId: service.owner_id,
      name: service.name, description: service.description,
      price: parseFloat(service.price), duration: service.duration,
      category: service.category, imageUrl: service.image_url,
      isActive: service.is_active, createdAt: service.created_at,
    });
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  // Check ownership
  const [service] = await sql`SELECT owner_id FROM services WHERE id = ${id}`;
  if (!service) return res.status(404).json({ error: 'Service not found' });
  if (auth.role !== 'admin' && service.owner_id !== auth.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

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
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json({
      id: updated.id, ownerId: updated.owner_id,
      name: updated.name, description: updated.description,
      price: parseFloat(updated.price), duration: updated.duration,
      category: updated.category, imageUrl: updated.image_url,
      isActive: updated.is_active,
    });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM services WHERE id = ${id}`;
    return res.status(200).json({ message: 'Service deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
