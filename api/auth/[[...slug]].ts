import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sql } from '../_lib/db';
import { generateToken, requireAuth, getTokenFromHeader, verifyToken } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import {
  sendWelcomeEmail,
  sendOwnerPendingEmail,
  sendPasswordReset,
} from '../_lib/email';

// ── POST /api/auth/login ──────────────────────────────────────────────────────
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const [user] = await sql`
    SELECT id, email, password_hash, first_name, last_name, phone, role, wallet_address, avatar_url, is_verified, approval_status
    FROM users WHERE email = ${email.toLowerCase()}
  `;
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.password_hash) return res.status(401).json({ error: 'Please sign in with Google or reset your password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  if (user.approval_status === 'pending') return res.status(403).json({ error: 'Your account is pending admin approval. You will be notified once approved.' });
  if (user.approval_status === 'rejected') return res.status(403).json({ error: 'Your account has been rejected. Please contact support.' });

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });
  return res.status(200).json({
    token,
    user: {
      id: user.id, email: user.email,
      firstName: user.first_name, lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone, role: user.role,
      walletAddress: user.wallet_address, avatarUrl: user.avatar_url,
      isVerified: user.is_verified,
    },
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { firstName, lastName, email, phone, password, role } = req.body;
  if (!firstName || !lastName || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });

  const validRoles = ['customer', 'detailer', 'owner'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const approvalStatus = role === 'owner' ? 'pending' : 'approved';

  const [user] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, approval_status, is_verified)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${phone || null}, ${role}, ${approvalStatus}, false)
    RETURNING id, email, first_name, last_name, phone, role, approval_status, created_at
  `;

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

  await sql`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (${user.id}, 'Welcome to AutoPayKe!', 'Your account has been created successfully. Book your first car wash today!', 'system')
  `;

  if (approvalStatus === 'pending') {
    sendOwnerPendingEmail(user.email as string, user.first_name as string)
      .catch((err: unknown) => console.error('Owner pending email failed:', err));
    return res.status(201).json({ message: 'Account created. Awaiting admin approval before you can access your dashboard.', requiresApproval: true });
  }

  sendWelcomeEmail(user.email as string, user.first_name as string, role as 'customer' | 'detailer' | 'owner')
    .catch((err: unknown) => console.error('Welcome email failed:', err));

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });
  return res.status(201).json({
    token,
    user: {
      id: user.id, email: user.email,
      firstName: user.first_name, lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone, role: user.role,
    },
  });
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  const [user] = await sql`
    SELECT id, email, first_name, last_name, phone, role, wallet_address, avatar_url, is_verified, created_at
    FROM users WHERE id = ${auth.userId}
  `;
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json({
    id: user.id, email: user.email,
    firstName: user.first_name, lastName: user.last_name,
    name: `${user.first_name} ${user.last_name}`,
    phone: user.phone, role: user.role,
    walletAddress: user.wallet_address, avatarUrl: user.avatar_url,
    isVerified: user.is_verified, createdAt: user.created_at,
  });
}

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
async function handleForgotPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const [user] = await sql`SELECT id, email, first_name FROM users WHERE email = ${email.toLowerCase()}`;
  if (!user) return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  try { await sendPasswordReset(user.email, resetUrl); } catch (err) { console.error('Failed to send reset email:', err); }

  return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
}

// ── GET /api/auth/google ──────────────────────────────────────────────────────
function handleGoogle(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const redirectUri = `${appUrl}/api/auth/google-callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

// ── GET /api/auth/google-callback ────────────────────────────────────────────
async function handleGoogleCallback(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { code } = req.query;
  if (!code) return res.redirect('/login?error=missing_code');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
  const redirectUri = `${appUrl}/api/auth/google-callback`;

  try {
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

    const tokens = await tokenRes.json() as { access_token?: string };
    if (!tokens.access_token) return res.redirect('/login?error=token_exchange_failed');

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json() as { id: string; email: string; given_name: string; family_name: string; picture: string };
    if (!googleUser.email) return res.redirect('/login?error=no_email');

    let [user] = await sql`SELECT * FROM users WHERE email = ${googleUser.email.toLowerCase()} OR google_id = ${googleUser.id}`;
    if (!user) {
      [user] = await sql`
        INSERT INTO users (email, first_name, last_name, google_id, avatar_url, role, is_verified, approval_status)
        VALUES (${googleUser.email.toLowerCase()}, ${googleUser.given_name || 'Google'}, ${googleUser.family_name || 'User'}, ${googleUser.id}, ${googleUser.picture || null}, 'customer', true, 'approved')
        RETURNING *
      `;
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${user.id}, 'Welcome to AutoPayKe!', 'Your account has been created via Google. Book your first car wash today!', 'system')
      `;
      sendWelcomeEmail(user.email as string, user.first_name as string, 'customer')
        .catch((err: unknown) => console.error('Google welcome email failed:', err));
    } else if (!user.google_id) {
      await sql`UPDATE users SET google_id = ${googleUser.id}, is_verified = true WHERE id = ${user.id}`;
    }

    if (user.approval_status === 'pending') return res.redirect('/login?error=pending_approval');
    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    return res.redirect(`/login?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.redirect('/login?error=oauth_failed');
  }
}

// ── POST /api/auth/submit-kyc ────────────────────────────────────────────────
async function handleSubmitKyc(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let userId: string | null = null;
  const token = getTokenFromHeader(req);
  if (token) {
    try { const payload = verifyToken(token); userId = payload.userId; } catch { /* ignore */ }
  }
  if (!userId) userId = req.body?.userId || null;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { businessName, businessAddress, businessCity, idDoc, photos } = req.body;
  await sql`
    INSERT INTO owner_applications (user_id, business_name, business_address, business_city, id_doc_name, id_doc_data, photos)
    VALUES (${userId}, ${businessName || null}, ${businessAddress || null}, ${businessCity || null}, ${idDoc?.name || null}, ${idDoc?.data || null}, ${JSON.stringify(photos || [])})
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

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');

  if (route === 'login')           return handleLogin(req, res);
  if (route === 'register')        return handleRegister(req, res);
  if (route === 'me')              return handleMe(req, res);
  if (route === 'forgot-password') return handleForgotPassword(req, res);
  if (route === 'google')          return handleGoogle(req, res);
  if (route === 'google-callback') return handleGoogleCallback(req, res);
  if (route === 'submit-kyc')      return handleSubmitKyc(req, res);

  return res.status(404).json({ error: 'Not found' });
}
