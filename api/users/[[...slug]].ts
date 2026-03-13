import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { sql } from '../_lib/db';
import { requireAuth, requireRole } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { sendStaffCredentials } from '../_lib/email';

// ── GET/POST /api/users ───────────────────────────────────────────────────────
async function handleIndex(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const auth = requireAuth(req, res);
    if (!auth) return;
    if (auth.role === 'admin') {
      const users = await sql`SELECT id, email, first_name, last_name, phone, role, is_verified, approval_status, created_at FROM users ORDER BY created_at DESC`;
      return res.status(200).json(users.map(u => ({ id: u.id, email: u.email, name: `${u.first_name} ${u.last_name}`, firstName: u.first_name, lastName: u.last_name, phone: u.phone, role: u.role, isVerified: u.is_verified, approvalStatus: u.approval_status, createdAt: u.created_at })));
    }
    if (auth.role === 'owner') {
      const detailers = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_verified, u.created_at
        FROM users u INNER JOIN owner_detailers od ON od.detailer_id = u.id
        WHERE od.owner_id = ${auth.userId} AND u.role = 'detailer' ORDER BY u.first_name
      `;
      return res.status(200).json(detailers.map(u => ({ id: u.id, email: u.email, name: `${u.first_name} ${u.last_name}`, firstName: u.first_name, lastName: u.last_name, phone: u.phone, role: 'detailer', isVerified: u.is_verified, createdAt: u.created_at })));
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (req.method === 'POST') {
    const auth = requireRole(req, res, ['admin']);
    if (!auth) return;
    const { firstName, lastName, email, phone, role, password } = req.body;
    if (!firstName || !lastName || !email || !role) return res.status(400).json({ error: 'Missing required fields' });
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const [user] = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, approval_status)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${phone || null}, ${role}, true, 'approved')
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;
    return res.status(201).json({ id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}`, role: user.role, phone: user.phone, createdAt: user.created_at });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── GET /api/users/lookup ────────────────────────────────────────────────────
async function handleLookup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;
  const { email, role } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const roleFilter = role ? role as string : null;
  let users;
  if (roleFilter) {
    users = await sql`SELECT id, email, first_name, last_name, phone, role, is_verified FROM users WHERE email = ${(email as string).toLowerCase()} AND role = ${roleFilter} LIMIT 1`;
  } else {
    users = await sql`SELECT id, email, first_name, last_name, phone, role, is_verified FROM users WHERE email = ${(email as string).toLowerCase()} LIMIT 1`;
  }
  if (users.length === 0) return res.status(404).json({ error: 'User not found' });
  const u = users[0];
  return res.status(200).json({ id: u.id, email: u.email, name: `${u.first_name} ${u.last_name}`, firstName: u.first_name, lastName: u.last_name, phone: u.phone, role: u.role, isVerified: u.is_verified });
}

// ── /api/users/staff — list + create owner staff (no app account required) ────
async function handleStaff(req: VercelRequest, res: VercelResponse) {
  const auth = requireRole(req, res, ['owner']);
  if (!auth) return;

  // Lazy-create owner_staff table
  await sql`
    CREATE TABLE IF NOT EXISTS owner_staff (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      total_washes INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  if (req.method === 'GET') {
    const staff = await sql`
      SELECT * FROM owner_staff WHERE owner_id = ${auth.userId} AND is_active = true ORDER BY name
    `;
    return res.status(200).json(staff.map(s => ({
      id: s.id, name: s.name, phone: s.phone, notes: s.notes,
      totalWashes: s.total_washes, createdAt: s.created_at,
    })));
  }

  if (req.method === 'POST') {
    const { name, phone, notes, detailerId, create, firstName, lastName, email, password } = req.body;

    // ── Mode 1: Simple offline staff (name + optional phone, no account) ───
    if (name && !create && !detailerId) {
      const [staff] = await sql`
        INSERT INTO owner_staff (owner_id, name, phone, notes)
        VALUES (${auth.userId}, ${name.trim()}, ${phone || null}, ${notes || null})
        RETURNING *
      `;
      return res.status(201).json({ id: staff.id, name: staff.name, phone: staff.phone, notes: staff.notes, totalWashes: 0 });
    }

    // ── Mode 2: Create detailer with full app account ─────────────────────
    if (create) {
      if (!firstName || !lastName || !email) return res.status(400).json({ error: 'First name, last name, and email are required' });
      const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
      if (existing.length > 0) return res.status(409).json({ error: 'A user with this email already exists' });
      const finalPassword = password || Math.random().toString(36).slice(-10) + 'A1!';
      const passwordHash = await bcrypt.hash(finalPassword, 10);
      const [user] = await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, approval_status)
        VALUES (${email.toLowerCase()}, ${passwordHash}, ${firstName}, ${lastName}, ${phone || null}, 'detailer', true, 'approved')
        RETURNING id, email, first_name, last_name, phone, role, created_at
      `;
      for (let day = 0; day < 7; day++) {
        const isAvailable = day >= 1 && day <= 5;
        await sql`
          INSERT INTO detailer_schedules (detailer_id, day_of_week, start_time, end_time, is_available)
          VALUES (${user.id}, ${day}, ${isAvailable ? '08:00' : null}, ${isAvailable ? '17:00' : null}, ${isAvailable})
          ON CONFLICT (detailer_id, day_of_week) DO NOTHING
        `;
      }
      await sql`INSERT INTO owner_detailers (owner_id, detailer_id) VALUES (${auth.userId}, ${user.id}) ON CONFLICT DO NOTHING`;
      const [owner] = await sql`SELECT first_name, last_name FROM users WHERE id = ${auth.userId}`;
      const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : undefined;
      sendStaffCredentials(user.email as string, user.first_name as string, finalPassword, ownerName)
        .catch((err: unknown) => console.error('Staff credentials email failed:', err));
      return res.status(201).json({ id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email, phone: user.phone, role: user.role, createdAt: user.created_at, tempPassword: finalPassword });
    }

    // ── Mode 3: Link existing detailer by id ─────────────────────────────
    if (detailerId) {
      const [detailer] = await sql`SELECT id FROM users WHERE id = ${detailerId} AND role = 'detailer'`;
      if (!detailer) return res.status(404).json({ error: 'Detailer not found' });
      await sql`INSERT INTO owner_detailers (owner_id, detailer_id) VALUES (${auth.userId}, ${detailerId}) ON CONFLICT DO NOTHING`;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Provide name, detailerId, or create=true' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── PATCH/DELETE /api/users/staff/:id — update or remove a simple staff member
async function handleStaffById(req: VercelRequest, res: VercelResponse, staffId: string) {
  const auth = requireRole(req, res, ['owner']);
  if (!auth) return;

  const [staff] = await sql`SELECT * FROM owner_staff WHERE id = ${staffId} AND owner_id = ${auth.userId}`;
  if (!staff) return res.status(404).json({ error: 'Staff member not found' });

  if (req.method === 'PATCH') {
    const { name, phone, notes } = req.body;
    const [updated] = await sql`
      UPDATE owner_staff SET
        name = COALESCE(${name || null}, name),
        phone = COALESCE(${phone ?? null}, phone),
        notes = COALESCE(${notes ?? null}, notes)
      WHERE id = ${staffId} RETURNING *
    `;
    return res.status(200).json({ id: updated.id, name: updated.name, phone: updated.phone, notes: updated.notes, totalWashes: updated.total_washes });
  }

  if (req.method === 'DELETE') {
    await sql`UPDATE owner_staff SET is_active = false WHERE id = ${staffId}`;
    return res.status(200).json({ message: 'Staff member removed' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── GET/PATCH/DELETE /api/users/:id ──────────────────────────────────────────
async function handleById(req: VercelRequest, res: VercelResponse, id: string) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (auth.role !== 'admin' && auth.userId !== id) return res.status(403).json({ error: 'Insufficient permissions' });

  if (req.method === 'GET') {
    // Lazy migrations: payment setting columns
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_phone TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_type TEXT DEFAULT 'phone'`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_till TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_paybill TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_account TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS crypto_wallet TEXT`.catch(() => {});
    const [user] = await sql`
      SELECT id, email, first_name, last_name, phone, role, wallet_address, avatar_url,
             is_verified, approval_status, created_at,
             mpesa_payout_phone, mpesa_payout_type, mpesa_payout_till,
             mpesa_payout_paybill, mpesa_payout_account, crypto_wallet
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
      // Payment settings
      mpesaPayoutPhone:   user.mpesa_payout_phone   || null,
      mpesaPayoutType:    user.mpesa_payout_type     || 'phone',
      mpesaPayoutTill:    user.mpesa_payout_till     || null,
      mpesaPayoutPaybill: user.mpesa_payout_paybill  || null,
      mpesaPayoutAccount: user.mpesa_payout_account  || null,
      cryptoWallet:       user.crypto_wallet         || user.wallet_address || null,
    });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_phone TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_type TEXT DEFAULT 'phone'`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_till TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_paybill TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_account TEXT`.catch(() => {});
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS crypto_wallet TEXT`.catch(() => {});

    const {
      firstName, lastName, phone, walletAddress, avatarUrl, password, approvalStatus,
      mpesaPayoutPhone, mpesaPayoutType, mpesaPayoutTill, mpesaPayoutPaybill,
      mpesaPayoutAccount, cryptoWallet,
    } = req.body;
    if (approvalStatus && auth.role !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    const [updated] = await sql`
      UPDATE users SET
        first_name          = COALESCE(${firstName || null}, first_name),
        last_name           = COALESCE(${lastName  || null}, last_name),
        phone               = COALESCE(${phone     || null}, phone),
        wallet_address      = COALESCE(${walletAddress || null}, wallet_address),
        avatar_url          = COALESCE(${avatarUrl || null}, avatar_url),
        password_hash       = COALESCE(${passwordHash || null}, password_hash),
        approval_status     = COALESCE(${approvalStatus || null}, approval_status),
        is_verified         = CASE WHEN ${approvalStatus || null} = 'approved' THEN true ELSE is_verified END,
        mpesa_payout_phone   = COALESCE(${mpesaPayoutPhone   ?? null}, mpesa_payout_phone),
        mpesa_payout_type    = COALESCE(${mpesaPayoutType    ?? null}, mpesa_payout_type),
        mpesa_payout_till    = COALESCE(${mpesaPayoutTill    ?? null}, mpesa_payout_till),
        mpesa_payout_paybill = COALESCE(${mpesaPayoutPaybill ?? null}, mpesa_payout_paybill),
        mpesa_payout_account = COALESCE(${mpesaPayoutAccount ?? null}, mpesa_payout_account),
        crypto_wallet        = COALESCE(${cryptoWallet       ?? null}, crypto_wallet)
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, phone, role, wallet_address, avatar_url,
                is_verified, approval_status,
                mpesa_payout_phone, mpesa_payout_type, mpesa_payout_till,
                mpesa_payout_paybill, mpesa_payout_account, crypto_wallet
    `;
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({
      id: updated.id, email: updated.email,
      name: `${updated.first_name} ${updated.last_name}`,
      firstName: updated.first_name, lastName: updated.last_name,
      phone: updated.phone, role: updated.role,
      walletAddress: updated.wallet_address, avatarUrl: updated.avatar_url,
      isVerified: updated.is_verified, approvalStatus: updated.approval_status,
      mpesaPayoutPhone:   updated.mpesa_payout_phone   || null,
      mpesaPayoutType:    updated.mpesa_payout_type     || 'phone',
      mpesaPayoutTill:    updated.mpesa_payout_till     || null,
      mpesaPayoutPaybill: updated.mpesa_payout_paybill  || null,
      mpesaPayoutAccount: updated.mpesa_payout_account  || null,
      cryptoWallet:       updated.crypto_wallet         || updated.wallet_address || null,
    });
  }

  if (req.method === 'DELETE') {
    if (auth.role !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });
    await sql`DELETE FROM users WHERE id = ${id}`;
    return res.status(200).json({ message: 'User deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');

  if (slug.length === 0 || route === 'index') return handleIndex(req, res);
  if (slug[0] === 'lookup') return handleLookup(req, res);
  if (slug[0] === 'staff' && slug.length === 1) return handleStaff(req, res);
  if (slug[0] === 'staff' && slug.length === 2) return handleStaffById(req, res, slug[1]);
  if (slug.length === 1) return handleById(req, res, slug[0]);

  return res.status(404).json({ error: 'Not found' });
}
