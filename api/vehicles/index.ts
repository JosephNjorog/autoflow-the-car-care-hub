import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const customerId = auth.role === 'admin' ? (req.query.customerId as string || auth.userId) : auth.userId;
    const vehicles = await sql`
      SELECT id, customer_id, make, model, year, color, license_plate, created_at
      FROM vehicles WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
    `;
    return res.status(200).json(vehicles.map(v => ({
      id: v.id, customerId: v.customer_id,
      make: v.make, model: v.model, year: v.year,
      color: v.color, licensePlate: v.license_plate,
      createdAt: v.created_at,
    })));
  }

  if (req.method === 'POST') {
    if (auth.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can add vehicles' });
    }
    const { make, model, year, color, licensePlate } = req.body;
    if (!make || !model || !licensePlate) {
      return res.status(400).json({ error: 'Make, model, and license plate are required' });
    }

    const [vehicle] = await sql`
      INSERT INTO vehicles (customer_id, make, model, year, color, license_plate)
      VALUES (${auth.userId}, ${make}, ${model}, ${year || null}, ${color || null}, ${licensePlate})
      RETURNING id, customer_id, make, model, year, color, license_plate, created_at
    `;

    return res.status(201).json({
      id: vehicle.id, customerId: vehicle.customer_id,
      make: vehicle.make, model: vehicle.model, year: vehicle.year,
      color: vehicle.color, licensePlate: vehicle.license_plate,
      createdAt: vehicle.created_at,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
