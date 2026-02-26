import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { generateToken } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { sendWelcomeEmail } from '../_lib/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.query;
  if (!code) return res.redirect('/login?error=missing_code');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const redirectUri = `${appUrl}/api/auth/google-callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json() as { access_token?: string; id_token?: string };
    if (!tokens.access_token) return res.redirect('/login?error=token_exchange_failed');

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json() as { id: string; email: string; given_name: string; family_name: string; picture: string };

    if (!googleUser.email) return res.redirect('/login?error=no_email');

    // Find or create user
    let [user] = await sql`SELECT * FROM users WHERE email = ${googleUser.email.toLowerCase()} OR google_id = ${googleUser.id}`;

    if (!user) {
      [user] = await sql`
        INSERT INTO users (email, first_name, last_name, google_id, avatar_url, role, is_verified, approval_status)
        VALUES (${googleUser.email.toLowerCase()}, ${googleUser.given_name || 'Google'}, ${googleUser.family_name || 'User'}, ${googleUser.id}, ${googleUser.picture || null}, 'customer', true, 'approved')
        RETURNING *
      `;
      // Welcome notification
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${user.id}, 'Welcome to AutoFlow!', 'Your account has been created via Google. Book your first car wash today!', 'system')
      `;
      sendWelcomeEmail(user.email as string, user.first_name as string, 'customer')
        .catch((err: unknown) => console.error('Google welcome email failed:', err));
    } else if (!user.google_id) {
      // Link Google account to existing user
      await sql`UPDATE users SET google_id = ${googleUser.id}, is_verified = true WHERE id = ${user.id}`;
    }

    if (user.approval_status === 'pending') {
      return res.redirect('/login?error=pending_approval');
    }

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    return res.redirect(`/login?token=${token}`);

  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.redirect('/login?error=oauth_failed');
  }
}
