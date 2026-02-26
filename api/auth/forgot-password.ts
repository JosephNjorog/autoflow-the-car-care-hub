import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { sql } from '../_lib/db';
import { sendPasswordReset } from '../_lib/email';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const [user] = await sql`SELECT id, email, first_name FROM users WHERE email = ${email.toLowerCase()}`;

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordReset(user.email, resetUrl);
  } catch (err) {
    console.error('Failed to send reset email:', err);
  }

  return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
}
