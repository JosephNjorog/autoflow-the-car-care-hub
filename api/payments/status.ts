import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

// Poll payment status for a booking (used after STK push)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).json({ error: 'Booking ID required' });

  const [transaction] = await sql`
    SELECT t.status, t.mpesa_code, t.amount, b.payment_status, b.status as booking_status
    FROM transactions t
    JOIN bookings b ON b.id = t.booking_id
    WHERE t.booking_id = ${bookingId as string}
    ORDER BY t.created_at DESC
    LIMIT 1
  `;

  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

  return res.status(200).json({
    paymentStatus: transaction.payment_status,
    transactionStatus: transaction.status,
    mpesaCode: transaction.mpesa_code,
    amount: parseFloat(transaction.amount),
    bookingStatus: transaction.booking_status,
  });
}
