import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

const DETAILER_COMMISSION = 0.40;

// ── GET /api/detailer/earnings ────────────────────────────────────────────────
async function handleEarnings(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (!['detailer', 'owner', 'admin'].includes(auth.role)) return res.status(403).json({ error: 'Insufficient permissions' });

  const detailerId = auth.role === 'detailer' ? auth.userId : (req.query.detailerId as string || auth.userId);

  const jobs = await sql`
    SELECT b.id, b.scheduled_date::text as date, s.price, s.name as service_name,
           c.first_name || ' ' || c.last_name as customer_name
    FROM bookings b JOIN services s ON s.id = b.service_id JOIN users c ON c.id = b.customer_id
    WHERE b.detailer_id = ${detailerId} AND b.status = 'completed'
    ORDER BY b.scheduled_date DESC LIMIT 100
  `;

  const earnings = jobs.map(j => ({
    id: j.id, date: j.date,
    amount: parseFloat((parseFloat(j.price) * DETAILER_COMMISSION).toFixed(2)),
    bookingId: j.id, serviceName: j.service_name, customerName: j.customer_name,
  }));

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayEarnings = earnings.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEarnings = earnings.filter(e => new Date(e.date) >= weekStart).reduce((sum, e) => sum + e.amount, 0);

  return res.status(200).json({
    earnings,
    summary: { total: totalEarnings, today: todayEarnings, thisWeek: weekEarnings, completedJobs: jobs.length },
  });
}

// ── GET/PUT /api/detailer/schedule ────────────────────────────────────────────
async function handleSchedule(req: VercelRequest, res: VercelResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role === 'customer') return res.status(403).json({ error: 'Insufficient permissions' });

  const detailerId = (req.query.detailerId as string) || auth.userId;

  if (req.method === 'GET') {
    const schedule = await sql`
      SELECT id, detailer_id, day_of_week, start_time::text, end_time::text, is_available
      FROM detailer_schedules WHERE detailer_id = ${detailerId} ORDER BY day_of_week
    `;
    if (schedule.length === 0) {
      return res.status(200).json(
        Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          startTime: i >= 1 && i <= 5 ? '08:00' : '',
          endTime: i >= 1 && i <= 5 ? '17:00' : '',
          isAvailable: i >= 1 && i <= 5,
        }))
      );
    }
    return res.status(200).json(schedule.map(s => ({ id: s.id, detailerId: s.detailer_id, dayOfWeek: s.day_of_week, startTime: s.start_time || '', endTime: s.end_time || '', isAvailable: s.is_available })));
  }

  if (req.method === 'PUT') {
    if (auth.role !== 'detailer' && auth.userId !== detailerId) return res.status(403).json({ error: 'Can only update your own schedule' });
    const { schedule } = req.body as { schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }> };
    if (!Array.isArray(schedule)) return res.status(400).json({ error: 'Schedule must be an array' });

    for (const day of schedule) {
      await sql`
        INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available)
        VALUES (${auth.userId}, ${day.dayOfWeek}, ${day.isAvailable && day.startTime ? day.startTime : null}, ${day.isAvailable && day.endTime ? day.endTime : null}, ${day.isAvailable})
        ON CONFLICT (detailer_id, day_of_week) DO UPDATE SET
          start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_available = EXCLUDED.is_available
      `;
    }
    return res.status(200).json({ message: 'Schedule updated successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');

  if (route === 'earnings') return handleEarnings(req, res);
  if (route === 'schedule') return handleSchedule(req, res);

  return res.status(404).json({ error: 'Not found' });
}
