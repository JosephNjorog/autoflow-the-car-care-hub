import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  const [user] = await sql`
    SELECT id, email, first_name, last_name, phone, role, wallet_address, avatar_url, is_verified, created_at
    FROM users WHERE id = ${auth.userId}
  `;

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    name: `${user.first_name} ${user.last_name}`,
    phone: user.phone,
    role: user.role,
    walletAddress: user.wallet_address,
    avatarUrl: user.avatar_url,
    isVerified: user.is_verified,
    createdAt: user.created_at,
  });
}
