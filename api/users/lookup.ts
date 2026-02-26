import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  const { email, role } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const roleFilter = role ? role as string : null;

  let users;
  if (roleFilter) {
    users = await sql`
      SELECT id, email, first_name, last_name, phone, role, is_verified
      FROM users
      WHERE email = ${(email as string).toLowerCase()} AND role = ${roleFilter}
      LIMIT 1
    `;
  } else {
    users = await sql`
      SELECT id, email, first_name, last_name, phone, role, is_verified
      FROM users
      WHERE email = ${(email as string).toLowerCase()}
      LIMIT 1
    `;
  }

  if (users.length === 0) return res.status(404).json({ error: 'User not found' });

  const u = users[0];
  return res.status(200).json({
    id: u.id,
    email: u.email,
    name: `${u.first_name} ${u.last_name}`,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone,
    role: u.role,
    isVerified: u.is_verified,
  });
}
