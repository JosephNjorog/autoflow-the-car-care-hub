import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  let transactions;

  if (auth.role === 'customer') {
    transactions = await sql`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
      FROM transactions t
      JOIN users c ON c.id = t.customer_id
      LEFT JOIN bookings b ON b.id = t.booking_id
      LEFT JOIN services s ON s.id = b.service_id
      WHERE t.customer_id = ${auth.userId}
      ORDER BY t.created_at DESC
    `;
  } else if (auth.role === 'owner') {
    transactions = await sql`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
      FROM transactions t
      JOIN users c ON c.id = t.customer_id
      LEFT JOIN bookings b ON b.id = t.booking_id
      LEFT JOIN services s ON s.id = b.service_id
      WHERE s.owner_id = ${auth.userId}
      ORDER BY t.created_at DESC
    `;
  } else if (auth.role === 'admin') {
    transactions = await sql`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
      FROM transactions t
      JOIN users c ON c.id = t.customer_id
      LEFT JOIN bookings b ON b.id = t.booking_id
      LEFT JOIN services s ON s.id = b.service_id
      ORDER BY t.created_at DESC
      LIMIT 1000
    `;
  } else {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  return res.status(200).json(transactions.map(t => ({
    id: t.id,
    bookingId: t.booking_id,
    customerId: t.customer_id,
    customerName: t.customer_name,
    serviceName: t.service_name,
    amount: parseFloat(t.amount),
    method: t.method,
    status: t.status,
    mpesaCode: t.mpesa_code,
    cryptoTxHash: t.crypto_tx_hash,
    cryptoToken: t.crypto_token,
    cryptoNetwork: t.crypto_network,
    date: t.created_at,
    createdAt: t.created_at,
  })));
}
