import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { handleCors } from '../_lib/cors';
import { getTokenFromHeader, verifyToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth is optional here — the user may have just registered and have a token
  let userId: string | null = null;
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch { /* ignore */ }
  }

  // Fall back to userId in body (sent right after register before token is stored)
  if (!userId) userId = req.body?.userId || null;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { businessName, businessAddress, businessCity, idDoc, photos } = req.body;

  await sql`
    INSERT INTO owner_applications (user_id, business_name, business_address, business_city, id_doc_name, id_doc_data, photos)
    VALUES (
      ${userId},
      ${businessName || null},
      ${businessAddress || null},
      ${businessCity || null},
      ${idDoc?.name || null},
      ${idDoc?.data || null},
      ${JSON.stringify(photos || [])}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      business_address = EXCLUDED.business_address,
      business_city = EXCLUDED.business_city,
      id_doc_name = EXCLUDED.id_doc_name,
      id_doc_data = EXCLUDED.id_doc_data,
      photos = EXCLUDED.photos
  `;

  return res.status(200).json({ success: true });
}
