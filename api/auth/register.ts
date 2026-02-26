import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { sql } from '../_lib/db';
import { generateToken } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, phone, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const validRoles = ['customer', 'detailer', 'owner'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Check for existing user
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Owners start with pending approval, others are approved immediately
  const approvalStatus = role === 'owner' ? 'pending' : 'approved';

  const [user] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, approval_status, is_verified)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${phone || null}, ${role}, ${approvalStatus}, false)
    RETURNING id, email, first_name, last_name, phone, role, approval_status, created_at
  `;

  // Seed default detailer schedule if role is detailer
  if (role === 'detailer') {
    for (let day = 0; day < 7; day++) {
      const isAvailable = day >= 1 && day <= 5;
      await sql`
        INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available)
        VALUES (${user.id}, ${day}, ${isAvailable ? '08:00' : null}, ${isAvailable ? '17:00' : null}, ${isAvailable})
        ON CONFLICT (detailer_id, day_of_week) DO NOTHING
      `;
    }
  }

  // Create welcome notification
  await sql`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (${user.id}, 'Welcome to AutoFlow!', 'Your account has been created successfully. Book your first car wash today!', 'system')
  `;

  if (approvalStatus === 'pending') {
    return res.status(201).json({
      message: 'Account created. Awaiting admin approval before you can access your dashboard.',
      requiresApproval: true,
    });
  }

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone,
      role: user.role,
    },
  });
}
