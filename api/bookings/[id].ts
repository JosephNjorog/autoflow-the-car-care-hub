import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, rawSql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

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

function mapBooking(b: Record<string, unknown>) {
  return {
    id: b.id, customerId: b.customer_id, customerName: b.customer_name,
    vehicleId: b.vehicle_id, vehicleName: b.vehicle_name,
    serviceId: b.service_id, serviceName: b.service_name,
    servicePrice: parseFloat(b.service_price as string),
    locationId: b.location_id, locationName: b.location_name,
    detailerId: b.detailer_id, detailerName: b.detailer_name,
    date: b.scheduled_date, time: b.scheduled_time,
    status: b.status, paymentStatus: b.payment_status, paymentMethod: b.payment_method,
    beforePhotos: b.before_photos || [], afterPhotos: b.after_photos || [],
    rating: b.rating, review: b.review, notes: b.notes, createdAt: b.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const auth = requireAuth(req, res);
  if (!auth) return;
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const [booking] = await rawSql(`${BOOKING_QUERY} WHERE b.id = $1`, [id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Access control
    if (auth.role === 'customer' && booking.customer_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (auth.role === 'detailer' && booking.detailer_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    return res.status(200).json(mapBooking(booking));
  }

  if (req.method === 'PATCH') {
    const [booking] = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { status, detailerId, rating, review, beforePhotos, afterPhotos } = req.body;

    // Status transitions
    if (status) {
      const allowed: Record<string, string[]> = {
        customer: ['cancelled'],
        detailer: ['in_progress', 'completed'],
        owner: ['confirmed', 'cancelled'],
        admin: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      };

      if (!allowed[auth.role]?.includes(status)) {
        return res.status(403).json({ error: `Your role cannot set status to '${status}'` });
      }

      await sql`UPDATE bookings SET status = ${status} WHERE id = ${id}`;

      // If completed, award loyalty points
      if (status === 'completed') {
        const points = Math.floor(parseFloat(booking.price || '0') / 10) || 10;
        await sql`
          INSERT INTO loyalty_points (customer_id, booking_id, points, description)
          SELECT b.customer_id, b.id, ${points}, s.name || ' completed'
          FROM bookings b JOIN services s ON s.id = b.service_id
          WHERE b.id = ${id}
        `;
        // Update payment status
        await sql`UPDATE bookings SET payment_status = 'completed' WHERE id = ${id}`;
        await sql`UPDATE transactions SET status = 'completed' WHERE booking_id = ${id}`;

        // Notify customer
        const [cust] = await sql`SELECT c.first_name, c.id FROM bookings b JOIN users c ON c.id = b.customer_id WHERE b.id = ${id}`;
        if (cust) {
          await sql`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (${cust.id}, 'Service Completed', 'Your service has been completed. Tap to leave a review!', 'booking')
          `;
        }
      }

      if (status === 'in_progress') {
        const [cust] = await sql`SELECT c.id, s.name as service_name FROM bookings b JOIN users c ON c.id = b.customer_id JOIN services s ON s.id = b.service_id WHERE b.id = ${id}`;
        if (cust) {
          await sql`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (${cust.id}, 'Service Started', ${'Your ' + cust.service_name + ' service has started!'}, 'booking')
          `;
        }
      }
    }

    // Assign detailer (owner only)
    if (detailerId !== undefined) {
      if (!['owner', 'admin'].includes(auth.role)) {
        return res.status(403).json({ error: 'Only owners can assign detailers' });
      }
      await sql`UPDATE bookings SET detailer_id = ${detailerId || null}, status = 'confirmed' WHERE id = ${id}`;

      if (detailerId) {
        await sql`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (${detailerId}, 'New Job Assigned', 'You have been assigned a new job. Check your schedule.', 'booking')
        `;
      }
    }

    // Rating (customer only)
    if (rating !== undefined) {
      if (auth.role !== 'customer' || booking.customer_id !== auth.userId) {
        return res.status(403).json({ error: 'Only the booking customer can leave a review' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Can only review completed bookings' });
      }
      await sql`UPDATE bookings SET rating = ${rating}, review = ${review || null} WHERE id = ${id}`;
    }

    // Photos (detailer only)
    if (beforePhotos !== undefined) {
      if (auth.role !== 'detailer' || booking.detailer_id !== auth.userId) {
        return res.status(403).json({ error: 'Only the assigned detailer can upload photos' });
      }
      await sql`UPDATE bookings SET before_photos = ${beforePhotos} WHERE id = ${id}`;
    }
    if (afterPhotos !== undefined) {
      if (auth.role !== 'detailer' || booking.detailer_id !== auth.userId) {
        return res.status(403).json({ error: 'Only the assigned detailer can upload photos' });
      }
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
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({ error: 'Cannot cancel a booking that is already in progress or completed' });
      }
    }

    await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${id}`;
    await sql`UPDATE transactions SET status = 'refunded' WHERE booking_id = ${id} AND status = 'completed'`;

    return res.status(200).json({ message: 'Booking cancelled' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
