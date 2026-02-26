import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

// ── GET/POST /api/vehicles ────────────────────────────────────────────────────
async function handleIndex(req: VercelRequest, res: VercelResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const customerId = auth.role === 'admin' ? (req.query.customerId as string || auth.userId) : auth.userId;
    const vehicles = await sql`
      SELECT id, customer_id, make, model, year, color, license_plate, created_at
      FROM vehicles WHERE customer_id = ${customerId} ORDER BY created_at DESC
    `;
    return res.status(200).json(vehicles.map(v => ({ id: v.id, customerId: v.customer_id, make: v.make, model: v.model, year: v.year, color: v.color, licensePlate: v.license_plate, createdAt: v.created_at })));
  }

  if (req.method === 'POST') {
    if (auth.role !== 'customer') return res.status(403).json({ error: 'Only customers can add vehicles' });
    const { make, model, year, color, licensePlate } = req.body;
    if (!make || !model || !licensePlate) return res.status(400).json({ error: 'Make, model, and license plate are required' });
    const [vehicle] = await sql`
      INSERT INTO vehicles (customer_id, make, model, year, color, license_plate)
      VALUES (${auth.userId}, ${make}, ${model}, ${year || null}, ${color || null}, ${licensePlate})
      RETURNING id, customer_id, make, model, year, color, license_plate, created_at
    `;
    return res.status(201).json({ id: vehicle.id, customerId: vehicle.customer_id, make: vehicle.make, model: vehicle.model, year: vehicle.year, color: vehicle.color, licensePlate: vehicle.license_plate, createdAt: vehicle.created_at });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── DELETE/PATCH/PUT /api/vehicles/:id ───────────────────────────────────────
async function handleById(req: VercelRequest, res: VercelResponse, id: string) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'DELETE') {
    const [vehicle] = await sql`SELECT customer_id FROM vehicles WHERE id = ${id}`;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (auth.role !== 'admin' && vehicle.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
    await sql`DELETE FROM vehicles WHERE id = ${id}`;
    return res.status(200).json({ message: 'Vehicle deleted' });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const [vehicle] = await sql`SELECT customer_id FROM vehicles WHERE id = ${id}`;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (auth.role !== 'admin' && vehicle.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
    const { make, model, year, color, licensePlate } = req.body;
    const [updated] = await sql`
      UPDATE vehicles SET
        make = COALESCE(${make || null}, make),
        model = COALESCE(${model || null}, model),
        year = COALESCE(${year || null}, year),
        color = COALESCE(${color || null}, color),
        license_plate = COALESCE(${licensePlate || null}, license_plate)
      WHERE id = ${id} RETURNING id, customer_id, make, model, year, color, license_plate
    `;
    return res.status(200).json({ id: updated.id, customerId: updated.customer_id, make: updated.make, model: updated.model, year: updated.year, color: updated.color, licensePlate: updated.license_plate });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  if (slug.length === 0) return handleIndex(req, res);
  if (slug.length === 1) return handleById(req, res, slug[0]);
  return res.status(404).json({ error: 'Not found' });
}
