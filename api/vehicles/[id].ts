import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;

  const { id } = req.query as { id: string };

  if (req.method === 'DELETE') {
    const [vehicle] = await sql`SELECT customer_id FROM vehicles WHERE id = ${id}`;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (auth.role !== 'admin' && vehicle.customer_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await sql`DELETE FROM vehicles WHERE id = ${id}`;
    return res.status(200).json({ message: 'Vehicle deleted' });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const [vehicle] = await sql`SELECT customer_id FROM vehicles WHERE id = ${id}`;
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (auth.role !== 'admin' && vehicle.customer_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { make, model, year, color, licensePlate } = req.body;
    const [updated] = await sql`
      UPDATE vehicles SET
        make = COALESCE(${make || null}, make),
        model = COALESCE(${model || null}, model),
        year = COALESCE(${year || null}, year),
        color = COALESCE(${color || null}, color),
        license_plate = COALESCE(${licensePlate || null}, license_plate)
      WHERE id = ${id}
      RETURNING id, customer_id, make, model, year, color, license_plate
    `;
    return res.status(200).json({
      id: updated.id, customerId: updated.customer_id,
      make: updated.make, model: updated.model, year: updated.year,
      color: updated.color, licensePlate: updated.license_plate,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
