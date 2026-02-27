import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, rawSql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { sendBookingConfirmation, sendBookingStatusEmail } from '../_lib/email';

function mapBooking(b: Record<string, unknown>) {
  return {
    id: b.id, customerId: b.customer_id, customerName: b.customer_name,
    vehicleId: b.vehicle_id, vehicleName: b.vehicle_name,
    serviceId: b.service_id, serviceName: b.service_name,
    servicePrice: parseFloat(b.service_price as string),
    locationId: b.location_id, locationName: b.location_name,
    detailerId: b.detailer_id, detailerName: b.detailer_name,
    staffId: b.staff_id, staffName: b.staff_name,
    date: b.scheduled_date, time: b.scheduled_time,
    status: b.status, paymentStatus: b.payment_status, paymentMethod: b.payment_method,
    paymentTiming: b.payment_timing || 'now',
    beforePhotos: b.before_photos || [], afterPhotos: b.after_photos || [],
    rating: b.rating, review: b.review, notes: b.notes, createdAt: b.created_at,
    awaitingConfirmationAt: b.awaiting_confirmation_at || null,
    escrowReleasedAt: b.escrow_released_at || null,
  };
}

const BOOKING_QUERY = `
  SELECT
    b.*,
    b.scheduled_date::text as scheduled_date,
    b.scheduled_time::text as scheduled_time,
    c.first_name || ' ' || c.last_name as customer_name,
    c.email as customer_email,
    v.make || ' ' || v.model || ' - ' || v.license_plate as vehicle_name,
    s.name as service_name,
    s.price as service_price,
    l.name as location_name,
    d.first_name || ' ' || d.last_name as detailer_name,
    os.name as staff_name
  FROM bookings b
  JOIN users c ON c.id = b.customer_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  JOIN services s ON s.id = b.service_id
  JOIN locations l ON l.id = b.location_id
  LEFT JOIN users d ON d.id = b.detailer_id
  LEFT JOIN owner_staff os ON os.id = b.staff_id
`;

function buildFilteredQuery(baseWhere: string, status: unknown, date: unknown, hasDateFilter: boolean) {
  const conditions = [baseWhere];
  const extra: string[] = [];
  let n = 2;
  if (status && status !== 'all') { extra.push(`b.status = $${n++}`); }
  if (hasDateFilter && date) { extra.push(`b.scheduled_date = $${n++}`); }
  const where = [...conditions, ...extra].join(' AND ');
  return `${BOOKING_QUERY} WHERE ${where} ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`;
}

// ── GET/POST /api/bookings ────────────────────────────────────────────────────
async function handleIndex(req: VercelRequest, res: VercelResponse) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  // Lazy migration: escrow columns
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_timing TEXT DEFAULT 'now'`.catch(() => {});
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS awaiting_confirmation_at TIMESTAMPTZ`.catch(() => {});
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ`.catch(() => {});

  if (req.method === 'GET') {
    // Auto-release escrow: bookings awaiting confirmation >2 hours → auto-complete + release
    await sql`
      UPDATE bookings SET status = 'completed', payment_status = 'released', escrow_released_at = NOW()
      WHERE status = 'awaiting_confirmation'
        AND payment_status = 'captured'
        AND awaiting_confirmation_at < NOW() - INTERVAL '2 hours'
    `.catch(() => {}); // Column may not exist yet on first run

    const { status, date } = req.query;
    let bookings: Record<string, unknown>[];

    if (auth.role === 'customer') {
      const params: unknown[] = [auth.userId];
      if (status && status !== 'all') params.push(status);
      if (date) params.push(date);
      bookings = await rawSql(buildFilteredQuery('b.customer_id = $1', status, date, true), params);
    } else if (auth.role === 'detailer') {
      const params: unknown[] = [auth.userId];
      if (status && status !== 'all') params.push(status);
      bookings = await rawSql(buildFilteredQuery('b.detailer_id = $1', status, null, false), params);
    } else if (auth.role === 'owner') {
      const params: unknown[] = [auth.userId];
      if (status && status !== 'all') params.push(status);
      bookings = await rawSql(buildFilteredQuery('s.owner_id = $1', status, null, false), params);
    } else if (auth.role === 'admin') {
      const params: unknown[] = [];
      let query = BOOKING_QUERY;
      if (status && status !== 'all') { query += ` WHERE b.status = $1`; params.push(status); }
      query += ` ORDER BY b.scheduled_date DESC, b.scheduled_time DESC LIMIT 500`;
      bookings = await rawSql(query, params);
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return res.status(200).json(bookings.map(mapBooking));
  }

  if (req.method === 'POST') {
    if (auth.role !== 'customer') return res.status(403).json({ error: 'Only customers can create bookings' });

    const { vehicleId, serviceId, locationId, date, time, paymentMethod, notes, paymentTiming } = req.body;
    if (!serviceId || !locationId || !date || !time || !paymentMethod) {
      return res.status(400).json({ error: 'Service, location, date, time, and payment method are required' });
    }
    if (paymentMethod === 'cash') {
      return res.status(400).json({ error: 'Cash payments are not accepted. Please use M-Pesa, card, or crypto.' });
    }

    const [service] = await sql`SELECT id, name, price FROM services WHERE id = ${serviceId} AND is_active = true`;
    if (!service) return res.status(400).json({ error: 'Service not found or unavailable' });

    const [location] = await sql`SELECT id, name FROM locations WHERE id = ${locationId} AND is_active = true`;
    if (!location) return res.status(400).json({ error: 'Location not found or unavailable' });

    if (vehicleId) {
      const [vehicle] = await sql`SELECT id FROM vehicles WHERE id = ${vehicleId} AND customer_id = ${auth.userId}`;
      if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });
    }

    const [booking] = await sql`
      INSERT INTO bookings (customer_id, vehicle_id, service_id, location_id, scheduled_date, scheduled_time, payment_method, notes, payment_timing)
      VALUES (${auth.userId}, ${vehicleId || null}, ${serviceId}, ${locationId}, ${date}, ${time}, ${paymentMethod}, ${notes || null}, ${paymentTiming || 'now'})
      RETURNING id
    `;

    await sql`
      INSERT INTO transactions (booking_id, customer_id, amount, method, status)
      VALUES (${booking.id}, ${auth.userId}, ${service.price}, ${paymentMethod}, 'pending')
    `;
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      SELECT owner_id, 'New Booking', ${'New booking for ' + service.name + ' at ' + location.name}, 'booking'
      FROM services WHERE id = ${serviceId}
    `;

    const [newBooking] = await rawSql(`${BOOKING_QUERY} WHERE b.id = $1`, [booking.id]);

    sql`SELECT email, first_name FROM users WHERE id = ${auth.userId}`.then(([customer]) => {
      if (customer) {
        sendBookingConfirmation(customer.email as string, customer.first_name as string, {
          serviceName: service.name as string,
          locationName: location.name as string,
          date: date as string,
          time: time as string,
          amount: parseFloat(service.price as string),
        }).catch((err: unknown) => console.error('Confirmation email failed:', err));
      }
    });

    return res.status(201).json(mapBooking(newBooking));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── GET/PATCH/DELETE /api/bookings/:id ───────────────────────────────────────
async function handleById(req: VercelRequest, res: VercelResponse, id: string) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
    const [booking] = await rawSql(`${BOOKING_QUERY} WHERE b.id = $1`, [id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (auth.role === 'customer' && booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
    if (auth.role === 'detailer' && booking.detailer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
    return res.status(200).json(mapBooking(booking));
  }

  if (req.method === 'PATCH') {
    // Lazy migrations
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_id UUID`.catch(() => {});
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_timing TEXT DEFAULT 'now'`.catch(() => {});
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS awaiting_confirmation_at TIMESTAMPTZ`.catch(() => {});
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ`.catch(() => {});

    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { status, detailerId, staffId, rating, review, beforePhotos, afterPhotos, confirmPickup } = req.body;

    // ── Customer confirms service is done + releases escrow ───────────────────
    if (confirmPickup) {
      if (auth.role !== 'customer' || booking.customer_id !== auth.userId)
        return res.status(403).json({ error: 'Only the customer can confirm service completion' });
      if (booking.status !== 'awaiting_confirmation')
        return res.status(400).json({ error: 'Service is not awaiting confirmation' });

      await sql`UPDATE bookings SET status = 'completed', escrow_released_at = NOW() WHERE id = ${id}`;

      if (booking.payment_status === 'captured') {
        // Pay-now escrow: funds were held, now release
        await sql`UPDATE bookings SET payment_status = 'released' WHERE id = ${id}`;
        await sql`UPDATE transactions SET status = 'completed' WHERE booking_id = ${id} AND status = 'captured'`;
      } else {
        // Pay-at-pickup: payment was just collected or not yet — mark released
        await sql`UPDATE bookings SET payment_status = 'released' WHERE id = ${id}`;
        await sql`UPDATE transactions SET status = 'completed' WHERE booking_id = ${id}`;
      }

      // Loyalty points (10 per KES 100 spent, min 10)
      const points = 10;
      await sql`
        INSERT INTO loyalty_points (customer_id, booking_id, points, description)
        VALUES (${booking.customer_id}, ${id}, ${points}, 'Service confirmed by customer')
        ON CONFLICT DO NOTHING
      `;

      // Notify car wash owner that payment was released
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        SELECT s.owner_id, 'Payment Released ✓',
          'Customer confirmed the service is complete. Your payment has been released.',
          'payment'
        FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.id = ${id}
      `;

      // Increment wash count for assigned staff
      if (booking.staff_id) {
        await sql`UPDATE owner_staff SET total_washes = total_washes + 1 WHERE id = ${booking.staff_id}`;
      }

      const [updated] = await rawSql(`${BOOKING_QUERY} WHERE b.id = $1`, [id]);
      return res.status(200).json(mapBooking(updated));
    }

    if (status) {
      const allowed: Record<string, string[]> = {
        customer: ['cancelled'],
        detailer: ['in_progress', 'awaiting_confirmation'],
        owner: ['confirmed', 'cancelled', 'awaiting_confirmation'],
        admin: ['pending', 'confirmed', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'],
      };
      if (!allowed[auth.role]?.includes(status)) return res.status(403).json({ error: `Your role cannot set status to '${status}'` });

      await sql`UPDATE bookings SET status = ${status} WHERE id = ${id}`;

      // Service is done — notify customer to confirm pickup and release payment
      if (status === 'awaiting_confirmation') {
        await sql`UPDATE bookings SET awaiting_confirmation_at = NOW() WHERE id = ${id}`;
        const [cust] = await sql`
          SELECT c.id, c.first_name, c.email, s.name as service_name, l.name as location_name, b.scheduled_date::text as date, b.payment_timing
          FROM bookings b JOIN users c ON c.id = b.customer_id JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id WHERE b.id = ${id}
        `;
        if (cust) {
          const payAtPickup = cust.payment_timing === 'pickup';
          const msg = payAtPickup
            ? `Your ${cust.service_name} is complete! Tap to pay and confirm pickup.`
            : `Your ${cust.service_name} is complete and looks great! Tap to view photos and confirm pickup to release payment.`;
          await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${cust.id}, 'Your Car is Ready! 🚗', ${msg}, 'booking')`;
          sendBookingStatusEmail(
            cust.email as string, cust.first_name as string, 'awaiting_confirmation' as string,
            { serviceName: cust.service_name as string, locationName: cust.location_name as string, date: cust.date as string, payAtPickup: !!payAtPickup }
          ).catch(() => {});
        }
      }

      // Admin/legacy force-complete (bypasses escrow — keeps backward compat)
      if (status === 'completed') {
        const points = 10;
        await sql`
          INSERT INTO loyalty_points (customer_id, booking_id, points, description)
          SELECT b.customer_id, b.id, ${points}, s.name || ' completed'
          FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.id = ${id}
        `;
        await sql`UPDATE bookings SET payment_status = 'completed', escrow_released_at = NOW() WHERE id = ${id}`;
        await sql`UPDATE transactions SET status = 'completed' WHERE booking_id = ${id}`;
        if (booking.staff_id) {
          await sql`UPDATE owner_staff SET total_washes = total_washes + 1 WHERE id = ${booking.staff_id}`;
        }
        const [cust] = await sql`
          SELECT c.first_name, c.last_name, c.email, c.id, s.name as service_name, l.name as location_name, b.scheduled_date::text as date
          FROM bookings b JOIN users c ON c.id = b.customer_id JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id WHERE b.id = ${id}
        `;
        if (cust) {
          await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${cust.id}, 'Service Completed', 'Your service has been completed. Tap to leave a review!', 'booking')`;
          sendBookingStatusEmail(cust.email as string, cust.first_name as string, 'completed', { serviceName: cust.service_name as string, locationName: cust.location_name as string, date: cust.date as string, loyaltyPoints: points }).catch(() => {});
        }
      }

      if (status === 'in_progress') {
        const [cust] = await sql`
          SELECT c.id, c.first_name, c.email, s.name as service_name, l.name as location_name, b.scheduled_date::text as date
          FROM bookings b JOIN users c ON c.id = b.customer_id JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id WHERE b.id = ${id}
        `;
        if (cust) {
          await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${cust.id}, 'Service Started', ${'Your ' + cust.service_name + ' service has started!'}, 'booking')`;
          sendBookingStatusEmail(cust.email as string, cust.first_name as string, 'in_progress', { serviceName: cust.service_name as string, locationName: cust.location_name as string, date: cust.date as string }).catch(() => {});
        }
      }

      if (status === 'confirmed') {
        const [cust] = await sql`
          SELECT c.first_name, c.email, s.name as service_name, l.name as location_name, b.scheduled_date::text as date
          FROM bookings b JOIN users c ON c.id = b.customer_id JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id WHERE b.id = ${id}
        `;
        if (cust) sendBookingStatusEmail(cust.email as string, cust.first_name as string, 'confirmed', { serviceName: cust.service_name as string, locationName: cust.location_name as string, date: cust.date as string }).catch(() => {});
      }

      if (status === 'cancelled') {
        const [cust] = await sql`
          SELECT c.first_name, c.email, s.name as service_name, l.name as location_name, b.scheduled_date::text as date
          FROM bookings b JOIN users c ON c.id = b.customer_id JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id WHERE b.id = ${id}
        `;
        if (cust) sendBookingStatusEmail(cust.email as string, cust.first_name as string, 'cancelled', { serviceName: cust.service_name as string, locationName: cust.location_name as string, date: cust.date as string }).catch(() => {});
      }
    }

    if (detailerId !== undefined) {
      if (!['owner', 'admin'].includes(auth.role)) return res.status(403).json({ error: 'Only owners can assign detailers' });
      await sql`UPDATE bookings SET detailer_id = ${detailerId || null}, status = 'confirmed' WHERE id = ${id}`;
      if (detailerId) await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${detailerId}, 'New Job Assigned', 'You have been assigned a new job. Check your schedule.', 'booking')`;
    }

    // Assign to an offline staff member (owner_staff table, no app account)
    if (staffId !== undefined) {
      if (!['owner', 'admin'].includes(auth.role)) return res.status(403).json({ error: 'Only owners can assign staff' });
      // Lazy-create owner_staff table in case it hasn't been created yet
      await sql`
        CREATE TABLE IF NOT EXISTS owner_staff (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id UUID NOT NULL, name TEXT NOT NULL, phone TEXT, notes TEXT,
          total_washes INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`UPDATE bookings SET staff_id = ${staffId || null}, status = 'confirmed' WHERE id = ${id}`;
    }

    if (rating !== undefined) {
      if (auth.role !== 'customer' || booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Only the booking customer can leave a review' });
      if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only review completed bookings' });
      await sql`UPDATE bookings SET rating = ${rating}, review = ${review || null} WHERE id = ${id}`;
    }

    if (beforePhotos !== undefined) {
      if (auth.role !== 'detailer' || booking.detailer_id !== auth.userId) return res.status(403).json({ error: 'Only the assigned detailer can upload photos' });
      await sql`UPDATE bookings SET before_photos = ${beforePhotos} WHERE id = ${id}`;
    }
    if (afterPhotos !== undefined) {
      if (auth.role !== 'detailer' || booking.detailer_id !== auth.userId) return res.status(403).json({ error: 'Only the assigned detailer can upload photos' });
      await sql`UPDATE bookings SET after_photos = ${afterPhotos} WHERE id = ${id}`;
    }

    const [updated] = await rawSql(`${BOOKING_QUERY} WHERE b.id = $1`, [id]);
    return res.status(200).json(mapBooking(updated));
  }

  if (req.method === 'DELETE') {
    const [booking] = await sql`SELECT customer_id, status FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (auth.role !== 'admin') {
      if (booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
      if (!['pending', 'confirmed'].includes(booking.status)) return res.status(400).json({ error: 'Cannot cancel a booking that is already in progress or completed' });
    }
    await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${id}`;
    await sql`UPDATE transactions SET status = 'refunded' WHERE booking_id = ${id} AND status = 'completed'`;
    return res.status(200).json({ message: 'Booking cancelled' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');

  if (slug.length === 0 || route === "index") return handleIndex(req, res);
  if (slug.length === 1) return handleById(req, res, slug[0]);

  return res.status(404).json({ error: 'Not found' });
}
