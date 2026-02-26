import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rawSql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  if (!['owner', 'admin'].includes(auth.role)) {
    return res.status(403).json({ error: 'Only owners and admins can view analytics' });
  }

  const ownerId = auth.role === 'admin'
    ? (req.query.ownerId as string | undefined) ?? null
    : auth.userId;

  // If owner-scoped, filter with $1; otherwise query entire platform
  const ownerCond = ownerId ? 'AND s.owner_id = $1' : '';
  const params = ownerId ? [ownerId] : [];

  const [summary] = await rawSql(`
    SELECT
      COUNT(b.id)                                                          AS total_bookings,
      COUNT(CASE WHEN b.status = 'completed' THEN 1 END)                  AS completed_bookings,
      COALESCE(SUM(CASE WHEN b.payment_status = 'completed' THEN s.price::numeric END), 0) AS total_revenue,
      COALESCE(AVG(CASE WHEN b.rating IS NOT NULL THEN b.rating END), 0)  AS avg_rating
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE 1=1 ${ownerCond}
  `, params);

  const revenueByMonth = await rawSql(`
    SELECT
      TO_CHAR(b.scheduled_date, 'Mon')         AS month,
      EXTRACT(YEAR  FROM b.scheduled_date)     AS year,
      EXTRACT(MONTH FROM b.scheduled_date)     AS month_num,
      COALESCE(SUM(s.price::numeric), 0)       AS revenue
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE b.status = 'completed'
      AND b.scheduled_date >= NOW() - INTERVAL '6 months'
      ${ownerCond}
    GROUP BY TO_CHAR(b.scheduled_date, 'Mon'),
             EXTRACT(YEAR FROM b.scheduled_date),
             EXTRACT(MONTH FROM b.scheduled_date)
    ORDER BY year, month_num
  `, params);

  const bookingsByStatus = await rawSql(`
    SELECT b.status, COUNT(*) AS count
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE 1=1 ${ownerCond}
    GROUP BY b.status
  `, params);

  const popularServices = await rawSql(`
    SELECT
      s.name,
      COUNT(b.id) AS count,
      COALESCE(SUM(CASE WHEN b.payment_status = 'completed' THEN s.price::numeric END), 0) AS revenue
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE 1=1 ${ownerCond}
    GROUP BY s.id, s.name
    ORDER BY count DESC
    LIMIT 10
  `, params);

  const customerGrowth = await rawSql(`
    SELECT
      TO_CHAR(u.created_at, 'Mon')           AS month,
      EXTRACT(MONTH FROM u.created_at)       AS month_num,
      COUNT(*)                               AS customers
    FROM users u
    WHERE u.role = 'customer'
      AND u.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(u.created_at, 'Mon'), EXTRACT(MONTH FROM u.created_at)
    ORDER BY month_num
  `);

  return res.status(200).json({
    totalRevenue:      parseFloat(summary?.total_revenue as string    || '0'),
    totalBookings:     parseInt(  summary?.total_bookings as string   || '0'),
    completedBookings: parseInt(  summary?.completed_bookings as string || '0'),
    averageRating:     parseFloat(parseFloat(summary?.avg_rating as string || '0').toFixed(1)),
    revenueByMonth: (revenueByMonth as Record<string,unknown>[]).map(r => ({
      month:   r.month,
      revenue: parseFloat(r.revenue as string),
    })),
    bookingsByStatus: (bookingsByStatus as Record<string,unknown>[]).map(b => ({
      status: String(b.status).replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      count:  parseInt(b.count as string),
    })),
    popularServices: (popularServices as Record<string,unknown>[]).map(s => ({
      name:    s.name,
      count:   parseInt(s.count as string),
      revenue: parseFloat(s.revenue as string),
    })),
    customerGrowth: (customerGrowth as Record<string,unknown>[]).map(c => ({
      month:     c.month,
      customers: parseInt(c.customers as string),
    })),
  });
}