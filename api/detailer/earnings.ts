import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

// Detailer earns 40% of service price
const DETAILER_COMMISSION = 0.40;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (!['detailer', 'owner', 'admin'].includes(auth.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const detailerId = auth.role === 'detailer' ? auth.userId : (req.query.detailerId as string || auth.userId);

  // Individual completed jobs with earnings
  const jobs = await sql`
    SELECT
      b.id,
      b.scheduled_date::text as date,
      s.price,
      s.name as service_name,
      c.first_name || ' ' || c.last_name as customer_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN users c ON c.id = b.customer_id
    WHERE b.detailer_id = ${detailerId}
      AND b.status = 'completed'
    ORDER BY b.scheduled_date DESC
    LIMIT 100
  `;

  const earnings = jobs.map(j => ({
    id: j.id,
    date: j.date,
    amount: parseFloat((parseFloat(j.price) * DETAILER_COMMISSION).toFixed(2)),
    bookingId: j.id,
    serviceName: j.service_name,
    customerName: j.customer_name,
  }));

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayEarnings = earnings.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);

  // Weekly earnings
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEarnings = earnings
    .filter(e => new Date(e.date) >= weekStart)
    .reduce((sum, e) => sum + e.amount, 0);

  return res.status(200).json({
    earnings,
    summary: {
      total: totalEarnings,
      today: todayEarnings,
      thisWeek: weekEarnings,
      completedJobs: jobs.length,
    },
  });
}
