import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

const TIERS = [
  { name: 'Bronze', min: 0 },
  { name: 'Silver', min: 1000 },
  { name: 'Gold', min: 3000 },
  { name: 'Platinum', min: 5000 },
];

function getTier(points: number) {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (points >= tier.min) current = tier;
  }
  return current;
}

function getNextTier(points: number) {
  for (const tier of TIERS) {
    if (points < tier.min) return tier;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  const customerId = auth.role === 'admin'
    ? (req.query.customerId as string || auth.userId)
    : auth.userId;

  const pointsRows = await sql`
    SELECT COALESCE(SUM(points), 0) as total
    FROM loyalty_points
    WHERE customer_id = ${customerId}
  `;

  const totalPoints = parseInt(pointsRows[0]?.total || '0');
  const currentTier = getTier(totalPoints);
  const nextTier = getNextTier(totalPoints);

  const history = await sql`
    SELECT lp.points, lp.description, lp.created_at,
           b.id as booking_id
    FROM loyalty_points lp
    LEFT JOIN bookings b ON b.id = lp.booking_id
    WHERE lp.customer_id = ${customerId}
    ORDER BY lp.created_at DESC
    LIMIT 20
  `;

  return res.status(200).json({
    totalPoints,
    tier: currentTier.name as 'Bronze' | 'Silver' | 'Gold' | 'Platinum',
    pointsToNextTier: nextTier ? nextTier.min - totalPoints : 0,
    nextTier: nextTier?.name || null,
    history: history.map(h => ({
      date: h.created_at,
      points: h.points,
      description: h.description || 'Service completed',
      bookingId: h.booking_id,
    })),
  });
}
