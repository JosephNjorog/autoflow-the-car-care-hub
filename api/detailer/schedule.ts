import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;

  const detailerId = (req.query.detailerId as string) || auth.userId;

  // Owners can view any detailer's schedule; detailers can only view their own
  if (auth.role === 'customer') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (req.method === 'GET') {
    const schedule = await sql`
      SELECT id, detailer_id, day_of_week, start_time::text, end_time::text, is_available
      FROM detailer_schedules
      WHERE detailer_id = ${detailerId}
      ORDER BY day_of_week
    `;

    // Return default schedule if none exists
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

    return res.status(200).json(schedule.map(s => ({
      id: s.id,
      detailerId: s.detailer_id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time || '',
      endTime: s.end_time || '',
      isAvailable: s.is_available,
    })));
  }

  if (req.method === 'PUT') {
    if (auth.role !== 'detailer' && auth.userId !== detailerId) {
      return res.status(403).json({ error: 'Can only update your own schedule' });
    }

    const { schedule } = req.body as { schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }> };

    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Schedule must be an array' });
    }

    for (const day of schedule) {
      await sql`
        INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available)
        VALUES (
          ${auth.userId},
          ${day.dayOfWeek},
          ${day.isAvailable && day.startTime ? day.startTime : null},
          ${day.isAvailable && day.endTime ? day.endTime : null},
          ${day.isAvailable}
        )
        ON CONFLICT (detailer_id, day_of_week)
        DO UPDATE SET
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          is_available = EXCLUDED.is_available
      `;
    }

    return res.status(200).json({ message: 'Schedule updated successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
