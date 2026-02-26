import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;

  const { id } = req.query as { id: string };

  // Only allow self-update or admin
  if (auth.role !== 'admin' && auth.userId !== id) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (req.method === 'GET') {
    const [user] = await sql`
      SELECT id, email, first_name, last_name, phone, role, wallet_address, avatar_url, is_verified, approval_status, created_at
      FROM users WHERE id = ${id}
    `;
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({
      id: user.id, email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name, lastName: user.last_name,
      phone: user.phone, role: user.role,
      walletAddress: user.wallet_address, avatarUrl: user.avatar_url,
      isVerified: user.is_verified, approvalStatus: user.approval_status,
      createdAt: user.created_at,
    });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { firstName, lastName, phone, walletAddress, avatarUrl, password, approvalStatus } = req.body;

    // Only admins can change approval status
    if (approvalStatus && auth.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const [updated] = await sql`
      UPDATE users SET
        first_name = COALESCE(${firstName || null}, first_name),
        last_name = COALESCE(${lastName || null}, last_name),
        phone = COALESCE(${phone || null}, phone),
        wallet_address = COALESCE(${walletAddress || null}, wallet_address),
        avatar_url = COALESCE(${avatarUrl || null}, avatar_url),
        password_hash = COALESCE(${passwordHash || null}, password_hash),
        approval_status = COALESCE(${approvalStatus || null}, approval_status),
        is_verified = CASE WHEN ${approvalStatus || null} = 'approved' THEN true ELSE is_verified END
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, phone, role, wallet_address, avatar_url, is_verified, approval_status
    `;

    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({
      id: updated.id, email: updated.email,
      name: `${updated.first_name} ${updated.last_name}`,
      firstName: updated.first_name, lastName: updated.last_name,
      phone: updated.phone, role: updated.role,
      walletAddress: updated.wallet_address, avatarUrl: updated.avatar_url,
      isVerified: updated.is_verified, approvalStatus: updated.approval_status,
    });
  }

  if (req.method === 'DELETE') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });
    await sql`DELETE FROM users WHERE id = ${id}`;
    return res.status(200).json({ message: 'User deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
