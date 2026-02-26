import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { sql } from '../_lib/db';
import { generateToken } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const [user] = await sql`
    SELECT id, email, password_hash, first_name, last_name, phone, role, wallet_address, avatar_url, is_verified, approval_status
    FROM users WHERE email = ${email.toLowerCase()}
  `;

  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  if (!user.password_hash) {
    return res.status(401).json({ error: 'Please sign in with Google or reset your password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  if (user.approval_status === 'pending') {
    return res.status(403).json({ error: 'Your account is pending admin approval. You will be notified once approved.' });
  }
  if (user.approval_status === 'rejected') {
    return res.status(403).json({ error: 'Your account has been rejected. Please contact support.' });
  }

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });

  return res.status(200).json({
    token,
    user: {
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
    },
  });
}
