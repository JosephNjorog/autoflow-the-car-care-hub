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

// ── POST /api/payments/mpesa-stk ─────────────────────────────────────────────
async function handleMpesaStk(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  const { bookingId, phone } = req.body;
  if (!bookingId || !phone) return res.status(400).json({ error: 'Booking ID and phone number are required' });

  const [booking] = await sql`
    SELECT b.id, b.customer_id, b.payment_status, s.price, s.name as service_name, l.name as location_name
    FROM bookings b JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id
    WHERE b.id = ${bookingId}
  `;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (auth.role === 'customer' && booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
  if (['completed', 'captured', 'released'].includes(booking.payment_status as string)) return res.status(400).json({ error: 'This booking has already been paid' });

  const amount = Math.ceil(parseFloat(booking.price));
  let mpesaPhone = phone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
  if (!mpesaPhone.startsWith('254')) mpesaPhone = '254' + mpesaPhone;

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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: password, Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', Amount: amount,
        PartyA: mpesaPhone, PartyB: shortcode, PhoneNumber: mpesaPhone,
        CallBackURL: callbackUrl,
        AccountReference: `AUTOFLOW-${bookingId.slice(0, 8).toUpperCase()}`,
        TransactionDesc: `AutoFlow: ${booking.service_name} at ${booking.location_name}`,
      }),
    });

    const stkData = await stkRes.json() as { ResponseCode: string; CheckoutRequestID: string; MerchantRequestID: string; CustomerMessage: string; ResponseDescription: string };
    if (stkData.ResponseCode !== '0') return res.status(400).json({ error: stkData.ResponseDescription || 'M-Pesa request failed. Please try again.' });

    await sql`
      UPDATE transactions SET
        mpesa_checkout_request_id = ${stkData.CheckoutRequestID},
        mpesa_merchant_request_id = ${stkData.MerchantRequestID}
      WHERE booking_id = ${bookingId}
    `;

    return res.status(200).json({ message: 'M-Pesa STK Push sent. Please enter your PIN on your phone.', checkoutRequestId: stkData.CheckoutRequestID, customerMessage: stkData.CustomerMessage });
  } catch (err) {
    console.error('M-Pesa STK error:', err);
    return res.status(500).json({ error: 'Failed to initiate M-Pesa payment. Please try again.' });
  }
}

// ── POST /api/payments/mpesa-callback ─────────────────────────────────────────
interface MpesaCallbackItem { Name: string; Value: string | number; }
interface MpesaCallback { Body: { stkCallback: { MerchantRequestID: string; CheckoutRequestID: string; ResultCode: number; ResultDesc: string; CallbackMetadata?: { Item: MpesaCallbackItem[] } } } }

async function handleMpesaCallback(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const callback = req.body as MpesaCallback;
  try {
    const stkCallback = callback?.Body?.stkCallback;
    if (!stkCallback) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    const [transaction] = await sql`
      SELECT t.*, b.customer_id FROM transactions t JOIN bookings b ON b.id = t.booking_id
      WHERE t.mpesa_checkout_request_id = ${CheckoutRequestID}
    `;
    if (!transaction) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item || [];
      const getItem = (name: string) => items.find((i: MpesaCallbackItem) => i.Name === name)?.Value;
      const mpesaReceiptNumber = getItem('MpesaReceiptNumber') as string;
      const amount = getItem('Amount') as number;

      // Escrow: funds captured by AutoFlow — not yet released to owner
      await sql`UPDATE transactions SET status = 'captured', mpesa_code = ${mpesaReceiptNumber || null}, amount = ${amount || transaction.amount} WHERE mpesa_checkout_request_id = ${CheckoutRequestID}`;
      await sql`UPDATE bookings SET payment_status = 'captured', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ${transaction.booking_id}`;

      await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${transaction.customer_id}, 'Payment Captured ✓', ${'KES ' + (amount || transaction.amount) + ' received via M-Pesa (Code: ' + (mpesaReceiptNumber || 'N/A') + '). Funds held in escrow until you confirm service completion.'}, 'payment')`;
      await sql`INSERT INTO notifications (user_id, title, message, type) SELECT s.owner_id, 'Booking Paid (Escrow)', ${'M-Pesa payment of KES ' + (amount || transaction.amount) + ' captured. Funds release when customer confirms pickup.'}, 'payment' FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.id = ${transaction.booking_id}`;
    } else {
      await sql`UPDATE transactions SET status = 'failed' WHERE mpesa_checkout_request_id = ${CheckoutRequestID}`;
      await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${transaction.customer_id}, 'Payment Failed', ${'M-Pesa payment failed: ' + ResultDesc + '. Please try again.'}, 'payment')`;
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa callback error:', err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

// ── GET /api/payments/status ──────────────────────────────────────────────────
async function handleStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;
  const { bookingId } = req.query;
  if (!bookingId) return res.status(400).json({ error: 'Booking ID required' });

  const [transaction] = await sql`
    SELECT t.status, t.mpesa_code, t.amount, b.payment_status, b.status as booking_status
    FROM transactions t JOIN bookings b ON b.id = t.booking_id
    WHERE t.booking_id = ${bookingId as string} ORDER BY t.created_at DESC LIMIT 1
  `;
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  return res.status(200).json({ paymentStatus: transaction.payment_status, transactionStatus: transaction.status, mpesaCode: transaction.mpesa_code, amount: parseFloat(transaction.amount), bookingStatus: transaction.booking_status });
}

// ── GET /api/payments/transactions ───────────────────────────────────────────
async function handleTransactions(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  let transactions;
  if (auth.role === 'customer') {
    transactions = await sql`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
      FROM transactions t JOIN users c ON c.id = t.customer_id LEFT JOIN bookings b ON b.id = t.booking_id LEFT JOIN services s ON s.id = b.service_id
      WHERE t.customer_id = ${auth.userId} ORDER BY t.created_at DESC
    `;
  } else if (auth.role === 'owner') {
    transactions = await sql`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
      FROM transactions t JOIN users c ON c.id = t.customer_id LEFT JOIN bookings b ON b.id = t.booking_id LEFT JOIN services s ON s.id = b.service_id
      WHERE s.owner_id = ${auth.userId} ORDER BY t.created_at DESC
    `;
  } else if (auth.role === 'admin') {
    transactions = await sql`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
      FROM transactions t JOIN users c ON c.id = t.customer_id LEFT JOIN bookings b ON b.id = t.booking_id LEFT JOIN services s ON s.id = b.service_id
      ORDER BY t.created_at DESC LIMIT 1000
    `;
  } else {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  return res.status(200).json(transactions.map(t => ({
    id: t.id, bookingId: t.booking_id, customerId: t.customer_id, customerName: t.customer_name,
    serviceName: t.service_name, amount: parseFloat(t.amount), method: t.method, status: t.status,
    mpesaCode: t.mpesa_code, cryptoTxHash: t.crypto_tx_hash, cryptoToken: t.crypto_token,
    cryptoNetwork: t.crypto_network, date: t.created_at, createdAt: t.created_at,
  })));
}

// ── POST /api/payments/mpesa-stk-pickup ──────────────────────────────────────
// Initiates M-Pesa STK Push for pay-at-pickup bookings (status = awaiting_confirmation)
async function handleMpesaStkPickup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth || auth.role !== 'customer') return;

  const { bookingId, phone } = req.body;
  if (!bookingId || !phone) return res.status(400).json({ error: 'Booking ID and phone number are required' });

  const [booking] = await sql`
    SELECT b.id, b.customer_id, b.payment_status, b.payment_timing, b.status, s.price, s.name as service_name, l.name as location_name
    FROM bookings b JOIN services s ON s.id = b.service_id JOIN locations l ON l.id = b.location_id
    WHERE b.id = ${bookingId}
  `;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
  if (booking.payment_timing !== 'pickup') return res.status(400).json({ error: 'This booking is not a pay-at-pickup booking' });
  if (booking.status !== 'awaiting_confirmation') return res.status(400).json({ error: 'Service must be complete before payment' });
  if (['completed', 'captured', 'released'].includes(booking.payment_status as string)) return res.status(400).json({ error: 'This booking has already been paid' });

  const amount = Math.ceil(parseFloat(booking.price));
  let mpesaPhone = phone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
  if (!mpesaPhone.startsWith('254')) mpesaPhone = '254' + mpesaPhone;

  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const timestamp = formatTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autoflow.vercel.app';
  const callbackUrl = `${appUrl}/api/payments/mpesa-callback`;

  // Ensure transaction row exists
  await sql`
    INSERT INTO transactions (booking_id, customer_id, amount, method, status)
    VALUES (${bookingId}, ${auth.userId}, ${booking.price}, 'mpesa', 'pending')
    ON CONFLICT DO NOTHING
  `;

  try {
    const accessToken = await getMpesaAccessToken();
    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: password, Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', Amount: amount,
        PartyA: mpesaPhone, PartyB: shortcode, PhoneNumber: mpesaPhone,
        CallBackURL: callbackUrl,
        AccountReference: `AUTOFLOW-${bookingId.slice(0, 8).toUpperCase()}`,
        TransactionDesc: `AutoFlow Pickup: ${booking.service_name} at ${booking.location_name}`,
      }),
    });
    const stkData = await stkRes.json() as { ResponseCode: string; CheckoutRequestID: string; MerchantRequestID: string; CustomerMessage: string; ResponseDescription: string };
    if (stkData.ResponseCode !== '0') return res.status(400).json({ error: stkData.ResponseDescription || 'M-Pesa request failed. Please try again.' });

    await sql`
      UPDATE transactions SET
        mpesa_checkout_request_id = ${stkData.CheckoutRequestID},
        mpesa_merchant_request_id = ${stkData.MerchantRequestID}
      WHERE booking_id = ${bookingId} AND status = 'pending'
    `;
    return res.status(200).json({ message: 'M-Pesa STK Push sent. Please enter your PIN.', checkoutRequestId: stkData.CheckoutRequestID, customerMessage: stkData.CustomerMessage });
  } catch (err) {
    console.error('M-Pesa STK Pickup error:', err);
    return res.status(500).json({ error: 'Failed to initiate M-Pesa payment. Please try again.' });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route = slug.join('/');

  if (route === 'mpesa-stk')         return handleMpesaStk(req, res);
  if (route === 'mpesa-stk-pickup')  return handleMpesaStkPickup(req, res);
  if (route === 'mpesa-callback')    return handleMpesaCallback(req, res);
  if (route === 'status')            return handleStatus(req, res);
  if (route === 'transactions')      return handleTransactions(req, res);

  return res.status(404).json({ error: 'Not found' });
}
