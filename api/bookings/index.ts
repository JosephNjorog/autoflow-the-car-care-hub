import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, rawSql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { sendBookingConfirmation } from '../_lib/email';

function mapBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    customerId: b.customer_id,
    customerName: b.customer_name,
    vehicleId: b.vehicle_id,
    vehicleName: b.vehicle_name,
    serviceId: b.service_id,
    serviceName: b.service_name,
    servicePrice: parseFloat(b.service_price as string),
    locationId: b.location_id,
    locationName: b.location_name,
    detailerId: b.detailer_id,
    detailerName: b.detailer_name,
    date: b.scheduled_date,
    time: b.scheduled_time,
    status: b.status,
    paymentStatus: b.payment_status,
    paymentMethod: b.payment_method,
    beforePhotos: b.before_photos || [],
    afterPhotos: b.after_photos || [],
    rating: b.rating,
    review: b.review,
    notes: b.notes,
    createdAt: b.created_at,
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
    d.first_name || ' ' || d.last_name as detailer_name
  FROM bookings b
  JOIN users c ON c.id = b.customer_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  JOIN services s ON s.id = b.service_id
  JOIN locations l ON l.id = b.location_id
  LEFT JOIN users d ON d.id = b.detailer_id
`;

/** Build a WHERE clause with $N params for an optional status/date filter on top of a base condition. */
function buildFilteredQuery(baseWhere: string, status: unknown, date: unknown, hasDateFilter: boolean) {
  const conditions = [baseWhere]; // baseWhere uses $1
  const extra: string[] = [];
  let n = 2; // next param index
  if (status && status !== 'all') { extra.push(`b.status = $${n++}`); }
  if (hasDateFilter && date) { extra.push(`b.scheduled_date = $${n++}`); }
  const where = [...conditions, ...extra].join(' AND ');
  return `${BOOKING_QUERY} WHERE ${where} ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === 'GET') {
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
      if (status && status !== 'all') {
        query += ` WHERE b.status = $1`;
        params.push(status);
      }
      query += ` ORDER BY b.scheduled_date DESC, b.scheduled_time DESC LIMIT 500`;
      bookings = await rawSql(query, params);

    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return res.status(200).json(bookings.map(mapBooking));
  }

  if (req.method === 'POST') {
    if (auth.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create bookings' });
    }

    const { vehicleId, serviceId, locationId, date, time, paymentMethod, notes } = req.body;
    if (!serviceId || !locationId || !date || !time || !paymentMethod) {
      return res.status(400).json({ error: 'Service, location, date, time, and payment method are required' });
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
      INSERT INTO bookings (customer_id, vehicle_id, service_id, location_id, scheduled_date, scheduled_time, payment_method, notes)
      VALUES (${auth.userId}, ${vehicleId || null}, ${serviceId}, ${locationId}, ${date}, ${time}, ${paymentMethod}, ${notes || null})
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

    // Send confirmation email non-blocking
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