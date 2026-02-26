import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const notifications = await sql`
      SELECT id, user_id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ${auth.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return res.status(200).json(notifications.map(n => ({
      id: n.id, userId: n.user_id,
      title: n.title, message: n.message,
      type: n.type, isRead: n.is_read, createdAt: n.created_at,
    })));
  }

  if (req.method === 'PATCH') {
    const { markAllRead, notificationId } = req.body;

    if (markAllRead) {
      await sql`UPDATE notifications SET is_read = true WHERE user_id = ${auth.userId}`;
      return res.status(200).json({ message: 'All notifications marked as read' });
    }

    if (notificationId) {
      await sql`
        UPDATE notifications SET is_read = true
        WHERE id = ${notificationId} AND user_id = ${auth.userId}
      `;
      return res.status(200).json({ message: 'Notification marked as read' });
    }

    return res.status(400).json({ error: 'Invalid request' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
