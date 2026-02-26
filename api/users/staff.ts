import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireRole } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import bcrypt from 'bcryptjs';
import { generateToken } from '../_lib/auth';
import { sendStaffCredentials } from '../_lib/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const auth = requireRole(req, res, ['owner']);
  if (!auth) return;

  if (req.method === 'POST') {
    const { detailerId, create, firstName, lastName, email, phone, password } = req.body;

    if (create) {
      // Create new detailer account and link to this owner
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
      }

      const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
      if (existing.length > 0) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }

      const finalPassword = password || Math.random().toString(36).slice(-10) + 'A1!';
      const passwordHash = await bcrypt.hash(finalPassword, 10);

      const [user] = await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, approval_status)
        VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${phone || null}, 'detailer', true, 'approved')
        RETURNING id, email, first_name, last_name, phone, role, created_at
      `;

      // Create detailer schedule defaults
      for (let day = 0; day < 7; day++) {
        const isAvailable = day >= 1 && day <= 5;
        await sql`
          INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available)
          VALUES (${user.id}, ${day}, ${isAvailable ? '08:00' : null}, ${isAvailable ? '17:00' : null}, ${isAvailable})
          ON CONFLICT (detailer_id, day_of_week) DO NOTHING
        `;
      }

      // Link to owner
      await sql`
        INSERT INTO owner_detailers (owner_id, detailer_id)
        VALUES (${auth.userId}, ${user.id})
        ON CONFLICT DO NOTHING
      `;

      // Email credentials to the new detailer non-blocking
      const [owner] = await sql`SELECT first_name, last_name FROM users WHERE id = ${auth.userId}`;
      const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : undefined;
      sendStaffCredentials(user.email as string, user.first_name as string, finalPassword, ownerName)
        .catch((err: unknown) => console.error('Staff credentials email failed:', err));

      return res.status(201).json({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
      });
    }

    if (detailerId) {
      // Link existing detailer to this owner
      const [detailer] = await sql`SELECT id FROM users WHERE id = ${detailerId} AND role = 'detailer'`;
      if (!detailer) return res.status(404).json({ error: 'Detailer not found' });

      await sql`
        INSERT INTO owner_detailers (owner_id, detailer_id)
        VALUES (${auth.userId}, ${detailerId})
        ON CONFLICT DO NOTHING
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Provide detailerId to link or create=true to create new staff' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
