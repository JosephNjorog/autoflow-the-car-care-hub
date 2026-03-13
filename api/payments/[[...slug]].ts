import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, rawSql } from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import {
  getMpesaAccessToken,
  formatTimestamp,
  normalisePhone,
  initiateStkPush,
  initiateB2CPayout,
  MPESA_BASE,
} from '../_lib/mpesa';

// ── Lazy migrations (run once on first request to this function) ──────────────
async function runMigrations() {
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_timing TEXT DEFAULT 'now'`.catch(() => {});
  await sql`ALTER TABLE bookings ALTER COLUMN status TYPE TEXT`.catch(() => {});
  await sql`ALTER TABLE bookings ALTER COLUMN payment_status TYPE TEXT`.catch(() => {});
  await sql`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check`.catch(() => {});
  await sql`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check`.catch(() => {});
  await sql`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check`.catch(() => {});
  await sql`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_method_check`.catch(() => {});
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id TEXT`.catch(() => {});
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id TEXT`.catch(() => {});
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mpesa_code TEXT`.catch(() => {});
}

// ── POST /api/payments/mpesa-stk ─────────────────────────────────────────────
// Customer-triggered STK push (pay-now before service)
async function handleMpesaStk(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  await runMigrations();

  const { bookingId, phone } = req.body;
  if (!bookingId || !phone) return res.status(400).json({ error: 'bookingId and phone are required' });

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
  if (['captured', 'released'].includes(booking.payment_status as string)) {
    return res.status(400).json({ error: 'This booking has already been paid' });
  }

  const amount = req.body.amount
    ? Math.ceil(parseFloat(req.body.amount))
    : Math.ceil(parseFloat(booking.price as string));

  try {
    const result = await initiateStkPush(
      normalisePhone(phone as string),
      amount,
      bookingId as string,
      `AutoPayKe: ${booking.service_name} at ${booking.location_name}`,
    );

    await sql`
      UPDATE transactions SET
        mpesa_checkout_request_id = ${result.checkoutRequestId},
        mpesa_merchant_request_id = ${result.merchantRequestId}
      WHERE booking_id = ${bookingId}
    `;

    return res.status(200).json({
      message: 'STK Push sent — please enter your M-Pesa PIN.',
      checkoutRequestId: result.checkoutRequestId,
      customerMessage:   result.customerMessage,
    });
  } catch (err) {
    console.error('mpesa-stk error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'M-Pesa request failed' });
  }
}

// ── POST /api/payments/request-payment ───────────────────────────────────────
// Owner-triggered STK push: owner enters customer phone → customer pays via M-Pesa PIN.
// This uses AutoPayKe's shortcode; the 90% payout to owner happens on escrow release.
async function handleRequestPayment(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;
  if (!['owner', 'admin'].includes(auth.role)) {
    return res.status(403).json({ error: 'Only business owners can request payments' });
  }

  const { bookingId, customerPhone } = req.body;
  if (!bookingId || !customerPhone) {
    return res.status(400).json({ error: 'bookingId and customerPhone are required' });
  }

  const [booking] = await sql`
    SELECT b.id, b.customer_id, b.payment_status, b.payment_timing,
           s.price, s.name as service_name, s.owner_id,
           l.name as location_name,
           c.first_name, c.phone as c_phone
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN locations l ON l.id = b.location_id
    JOIN users c ON c.id = b.customer_id
    WHERE b.id = ${bookingId}
  `;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  // Owners can only request payment for their own services
  if (auth.role === 'owner' && booking.owner_id !== auth.userId) {
    return res.status(403).json({ error: 'This booking does not belong to your business' });
  }

  if (['captured', 'released'].includes(booking.payment_status as string)) {
    return res.status(400).json({ error: 'Payment has already been captured for this booking' });
  }

  const amount = Math.ceil(parseFloat(booking.price as string));
  const phone  = normalisePhone(customerPhone as string);

  // Ensure a transaction row exists
  await sql`
    INSERT INTO transactions (booking_id, customer_id, amount, method, status)
    VALUES (${bookingId}, ${booking.customer_id}, ${booking.price}, 'mpesa', 'pending')
    ON CONFLICT DO NOTHING
  `;

  try {
    const result = await initiateStkPush(
      phone,
      amount,
      bookingId as string,
      `Payment request: ${booking.service_name} at ${booking.location_name}`,
    );

    await sql`
      UPDATE transactions SET
        mpesa_checkout_request_id = ${result.checkoutRequestId},
        mpesa_merchant_request_id = ${result.merchantRequestId}
      WHERE booking_id = ${bookingId} AND status = 'pending'
    `;

    // Notify customer
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (${booking.customer_id}, 'Payment Request 💳',
        ${'Your service provider has sent you an M-Pesa payment request of KES ' + amount + ' for ' + booking.service_name + '. Check your phone and enter your PIN.'},
        'payment')
    `;

    return res.status(200).json({
      message: `STK Push sent to ${phone}. Customer should see it within seconds.`,
      checkoutRequestId: result.checkoutRequestId,
      customerMessage:   result.customerMessage,
      amount,
    });
  } catch (err) {
    console.error('request-payment error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'M-Pesa request failed' });
  }
}

// ── POST /api/payments/mpesa-callback ─────────────────────────────────────────
interface MpesaCallbackItem { Name: string; Value: string | number; }
interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: MpesaCallbackItem[] };
    };
  };
}

async function handleMpesaCallback(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const callback = req.body as MpesaCallback;
  try {
    const stkCallback = callback?.Body?.stkCallback;
    if (!stkCallback) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const [transaction] = await sql`
      SELECT t.*, b.customer_id, s.owner_id, s.price
      FROM transactions t
      JOIN bookings b ON b.id = t.booking_id
      JOIN services s ON s.id = b.service_id
      WHERE t.mpesa_checkout_request_id = ${CheckoutRequestID}
    `;
    if (!transaction) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    if (ResultCode === 0) {
      const items   = CallbackMetadata?.Item || [];
      const getItem = (name: string) => items.find((i: MpesaCallbackItem) => i.Name === name)?.Value;
      const mpesaCode = getItem('MpesaReceiptNumber') as string;
      const amount    = getItem('Amount') as number;

      await sql`
        UPDATE transactions
        SET status = 'captured', mpesa_code = ${mpesaCode || null}, amount = COALESCE(${amount || null}, amount)
        WHERE mpesa_checkout_request_id = ${CheckoutRequestID}
      `;
      await sql`
        UPDATE bookings
        SET payment_status = 'captured',
            status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
        WHERE id = ${transaction.booking_id}
      `;

      const paid = amount || parseFloat(transaction.amount as string);
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${transaction.customer_id},
          'Payment Received ✓',
          ${'KES ' + paid + ' received via M-Pesa' + (mpesaCode ? ' (Code: ' + mpesaCode + ')' : '') + '. Funds held in escrow until you confirm service completion.'},
          'payment')
      `;
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        SELECT s.owner_id,
          'Payment Captured (Escrow)',
          ${'KES ' + paid + ' M-Pesa payment captured for booking. Funds released when customer confirms service completion.'},
          'payment'
        FROM bookings b JOIN services s ON s.id = b.service_id
        WHERE b.id = ${transaction.booking_id}
      `;
    } else {
      await sql`UPDATE transactions SET status = 'failed' WHERE mpesa_checkout_request_id = ${CheckoutRequestID}`;
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${transaction.customer_id}, 'Payment Failed',
          ${'M-Pesa payment failed: ' + ResultDesc + '. Please try again.'},
          'payment')
      `;
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
  if (!bookingId) return res.status(400).json({ error: 'bookingId required' });

  const [t] = await sql`
    SELECT t.status, t.mpesa_code, t.amount, b.payment_status, b.status as booking_status
    FROM transactions t JOIN bookings b ON b.id = t.booking_id
    WHERE t.booking_id = ${bookingId as string}
    ORDER BY t.created_at DESC LIMIT 1
  `;
  if (!t) return res.status(404).json({ error: 'Transaction not found' });
  return res.status(200).json({
    paymentStatus:    t.payment_status,
    transactionStatus: t.status,
    mpesaCode:        t.mpesa_code,
    amount:           parseFloat(t.amount as string),
    bookingStatus:    t.booking_status,
  });
}

// ── GET /api/payments/transactions ───────────────────────────────────────────
async function handleTransactions(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  let transactions;
  const BASE = `
    SELECT t.*, c.first_name || ' ' || c.last_name as customer_name, s.name as service_name
    FROM transactions t
    JOIN users c ON c.id = t.customer_id
    LEFT JOIN bookings b ON b.id = t.booking_id
    LEFT JOIN services s ON s.id = b.service_id
  `;

  if (auth.role === 'customer') {
    transactions = await rawSql(`${BASE} WHERE t.customer_id = $1 ORDER BY t.created_at DESC`, [auth.userId]);
  } else if (auth.role === 'owner') {
    transactions = await rawSql(`${BASE} WHERE s.owner_id = $1 ORDER BY t.created_at DESC`, [auth.userId]);
  } else if (auth.role === 'admin') {
    transactions = await rawSql(`${BASE} ORDER BY t.created_at DESC LIMIT 1000`, []);
  } else {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  return res.status(200).json(
    transactions.map(t => ({
      id: t.id, bookingId: t.booking_id, customerId: t.customer_id,
      customerName: t.customer_name, serviceName: t.service_name,
      amount: parseFloat(t.amount as string), method: t.method, status: t.status,
      mpesaCode: t.mpesa_code, cryptoTxHash: t.crypto_tx_hash,
      cryptoToken: t.crypto_token, cryptoNetwork: t.crypto_network,
      date: t.created_at, createdAt: t.created_at,
    })),
  );
}

// ── POST /api/payments/mpesa-stk-pickup ──────────────────────────────────────
async function handleMpesaStkPickup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth || auth.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can initiate pickup payment' });
  }

  await runMigrations();

  const { bookingId, phone } = req.body;
  if (!bookingId || !phone) return res.status(400).json({ error: 'bookingId and phone are required' });

  const [booking] = await sql`
    SELECT b.id, b.customer_id, b.payment_status, b.payment_timing, b.status,
           s.price, s.name as service_name, l.name as location_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN locations l ON l.id = b.location_id
    WHERE b.id = ${bookingId}
  `;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
  if (booking.payment_timing !== 'pickup') return res.status(400).json({ error: 'Not a pay-at-pickup booking' });
  if (booking.status !== 'awaiting_confirmation') return res.status(400).json({ error: 'Service must be complete before payment' });
  if (['captured', 'released'].includes(booking.payment_status as string)) return res.status(400).json({ error: 'Already paid' });

  await sql`
    INSERT INTO transactions (booking_id, customer_id, amount, method, status)
    VALUES (${bookingId}, ${auth.userId}, ${booking.price}, 'mpesa', 'pending')
    ON CONFLICT DO NOTHING
  `;

  try {
    const result = await initiateStkPush(
      normalisePhone(phone as string),
      Math.ceil(parseFloat(booking.price as string)),
      bookingId as string,
      `AutoPayKe Pickup: ${booking.service_name} at ${booking.location_name}`,
    );

    await sql`
      UPDATE transactions SET
        mpesa_checkout_request_id = ${result.checkoutRequestId},
        mpesa_merchant_request_id = ${result.merchantRequestId}
      WHERE booking_id = ${bookingId} AND status = 'pending'
    `;

    return res.status(200).json({
      message: 'STK Push sent — enter your M-Pesa PIN.',
      checkoutRequestId: result.checkoutRequestId,
      customerMessage:   result.customerMessage,
    });
  } catch (err) {
    console.error('mpesa-stk-pickup error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'M-Pesa request failed' });
  }
}

// ── POST /api/payments/flutterwave-verify ─────────────────────────────────────
async function handleFlutterwaveVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = requireAuth(req, res);
  if (!auth) return;

  const { transactionId, bookingId } = req.body;
  if (!transactionId || !bookingId) return res.status(400).json({ error: 'transactionId and bookingId are required' });

  const [booking] = await sql`
    SELECT b.id, b.customer_id, b.payment_status, s.price
    FROM bookings b JOIN services s ON s.id = b.service_id
    WHERE b.id = ${bookingId}
  `;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (auth.role === 'customer' && booking.customer_id !== auth.userId) return res.status(403).json({ error: 'Not authorized' });
  if (['captured', 'released'].includes(booking.payment_status as string)) return res.status(400).json({ error: 'Already paid' });

  try {
    const fwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    });
    const fwData = await fwRes.json() as { status: string; data?: { status: string; amount: number } };
    if (fwData.status !== 'success' || fwData.data?.status !== 'successful') {
      return res.status(400).json({ error: 'Flutterwave payment not successful' });
    }

    const amount = fwData.data!.amount;
    await sql`UPDATE transactions SET status = 'captured', amount = ${amount} WHERE booking_id = ${bookingId}`;
    await sql`
      UPDATE bookings
      SET payment_status = 'captured', payment_method = 'card',
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
      WHERE id = ${bookingId}
    `;
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (${booking.customer_id}, 'Payment Captured ✓',
        ${'KES ' + amount + ' card payment received. Held in escrow until you confirm service.'},
        'payment')
    `;
    return res.status(200).json({ success: true, amount });
  } catch (err) {
    console.error('Flutterwave verify error:', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
}

// ── B2C callbacks ─────────────────────────────────────────────────────────────
async function handleB2cResult(req: VercelRequest, res: VercelResponse) {
  try {
    const result = req.body?.Result;
    if (result?.ResultCode === '0' || result?.ResultCode === 0) {
      console.log('B2C payout succeeded:', result?.TransactionID, '| Conversation:', result?.ConversationID);
    } else {
      console.error('B2C payout failed:', result?.ResultDesc, '| Conversation:', result?.ConversationID);
    }
  } catch (err) {
    console.error('B2C result error:', err);
  }
  return res.status(200).json({ ResultCode: '00000000', ResultDesc: 'Accepted' });
}

async function handleB2cTimeout(req: VercelRequest, res: VercelResponse) {
  console.error('B2C timeout:', req.body);
  return res.status(200).json({ ResultCode: '00000000', ResultDesc: 'Accepted' });
}

// ── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  const urlPath = (req.url ?? '').split('?')[0];
  const slug    = urlPath.replace(/^\/api\/[^/]+\/?/, '').split('/').filter(Boolean);
  const route   = slug.join('/');

  if (route === 'mpesa-stk')           return handleMpesaStk(req, res);
  if (route === 'request-payment')     return handleRequestPayment(req, res);
  if (route === 'mpesa-stk-pickup')    return handleMpesaStkPickup(req, res);
  if (route === 'mpesa-callback')      return handleMpesaCallback(req, res);
  if (route === 'status')              return handleStatus(req, res);
  if (route === 'transactions')        return handleTransactions(req, res);
  if (route === 'flutterwave-verify')  return handleFlutterwaveVerify(req, res);
  if (route === 'b2c-result')          return handleB2cResult(req, res);
  if (route === 'b2c-timeout')         return handleB2cTimeout(req, res);

  return res.status(404).json({ error: 'Not found' });
}
