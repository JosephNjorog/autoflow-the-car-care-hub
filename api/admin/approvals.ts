import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireRole } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireRole(req, res, ['admin']);
  if (!auth) return;

  if (req.method === 'GET') {
    const pending = await sql`
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users
      WHERE approval_status = 'pending'
      ORDER BY created_at ASC
    `;
    return res.status(200).json(pending.map(u => ({
      id: u.id, email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      phone: u.phone, role: u.role, createdAt: u.created_at,
    })));
  }

  if (req.method === 'PATCH') {
    const { userId, action } = req.body;
    if (!userId || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'userId and action (approve/reject) required' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const [user] = await sql`
      UPDATE users SET
        approval_status = ${newStatus},
        is_verified = ${newStatus === 'approved'}
      WHERE id = ${userId}
      RETURNING email, first_name, role
    `;

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Send notification to the user
    const message = action === 'approve'
      ? 'Your account has been approved! You can now log in to your dashboard.'
      : 'Your account application has been rejected. Please contact support for more information.';

    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (${userId}, ${action === 'approve' ? 'Account Approved' : 'Account Rejected'}, ${message}, 'system')
    `;

    return res.status(200).json({ message: `User ${action}d successfully` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
