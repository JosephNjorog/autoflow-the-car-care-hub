import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth, requireRole } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  // GET /api/users — admin: all users; owner: their detailers
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;

    if (auth.role === 'admin') {
      const users = await sql`
        SELECT id, email, first_name, last_name, phone, role, is_verified, approval_status, created_at
        FROM users ORDER BY created_at DESC
      `;
      return res.status(200).json(users.map(u => ({
        id: u.id, email: u.email,
        name: `${u.first_name} ${u.last_name}`,
        firstName: u.first_name, lastName: u.last_name,
        phone: u.phone, role: u.role, isVerified: u.is_verified,
        approvalStatus: u.approval_status, createdAt: u.created_at,
      })));
    }

    if (auth.role === 'owner') {
      const detailers = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_verified, u.created_at
        FROM users u
        INNER JOIN owner_detailers od ON od.detailer_id = u.id
        WHERE od.owner_id = ${auth.userId} AND u.role = 'detailer'
        ORDER BY u.first_name
      `;
      return res.status(200).json(detailers.map(u => ({
        id: u.id, email: u.email,
        name: `${u.first_name} ${u.last_name}`,
        firstName: u.first_name, lastName: u.last_name,
        phone: u.phone, role: 'detailer', isVerified: u.is_verified, createdAt: u.created_at,
      })));
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // POST /api/users — admin creates users
  if (req.method === 'POST') {
    const auth = requireRole(req, res, ['admin']);
    if (!auth) return;

    const { firstName, lastName, email, phone, role, password } = req.body;
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const [user] = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, approval_status)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${phone || null}, ${role}, true, 'approved')
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;

    return res.status(201).json({
      id: user.id, email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role, phone: user.phone, createdAt: user.created_at,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
