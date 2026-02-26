import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';

const MPESA_BASE = 'https://sandbox.safaricom.co.ke';

async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function formatTimestamp(): string {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = requireAuth(req, res);
  if (!auth) return;

  const { bookingId, phone } = req.body;
  if (!bookingId || !phone) {
    return res.status(400).json({ error: 'Booking ID and phone number are required' });
  }

  // Validate booking belongs to customer and is pending payment
  const [booking] = await sql`
    SELECT b.id, b.customer_id, b.payment_status, s.price, s.name as service_name, l.name as location_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN locations l ON l.id = b.location_id
    WHERE b.id = ${bookingId}
  `;

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (auth.role === 'customer' && booking.customer_id !== auth.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (booking.payment_status === 'completed') {
    return res.status(400).json({ error: 'This booking has already been paid' });
  }

  const amount = Math.ceil(parseFloat(booking.price));

  // Sanitize phone: ensure it starts with 254
  let mpesaPhone = phone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
  if (!mpesaPhone.startsWith('254')) {
    mpesaPhone = '254' + mpesaPhone;
  }

  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const timestamp = formatTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autoflow.vercel.app';
  const callbackUrl = `${appUrl}/api/payments/mpesa-callback`;

  try {
    const accessToken = await getMpesaAccessToken();

    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: mpesaPhone,
        PartyB: shortcode,
        PhoneNumber: mpesaPhone,
        CallBackURL: callbackUrl,
        AccountReference: `AUTOFLOW-${bookingId.slice(0, 8).toUpperCase()}`,
        TransactionDesc: `AutoFlow: ${booking.service_name} at ${booking.location_name}`,
      }),
    });

    const stkData = await stkRes.json() as {
      ResponseCode: string;
      CheckoutRequestID: string;
      MerchantRequestID: string;
      CustomerMessage: string;
      ResponseDescription: string;
    };

    if (stkData.ResponseCode !== '0') {
      return res.status(400).json({
        error: stkData.ResponseDescription || 'M-Pesa request failed. Please try again.',
      });
    }

    // Save checkout request ID to transaction for matching in callback
    await sql`
      UPDATE transactions
      SET mpesa_checkout_request_id = ${stkData.CheckoutRequestID},
          mpesa_merchant_request_id = ${stkData.MerchantRequestID}
      WHERE booking_id = ${bookingId}
    `;

    return res.status(200).json({
      message: 'M-Pesa STK Push sent. Please enter your PIN on your phone.',
      checkoutRequestId: stkData.CheckoutRequestID,
      customerMessage: stkData.CustomerMessage,
    });

  } catch (err) {
    console.error('M-Pesa STK error:', err);
    return res.status(500).json({ error: 'Failed to initiate M-Pesa payment. Please try again.' });
  }
}
