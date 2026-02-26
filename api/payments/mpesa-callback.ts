import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { handleCors } from '../_lib/cors';

interface MpesaCallbackItem {
  Name: string;
  Value: string | number;
}

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: MpesaCallbackItem[];
      };
    };
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  // Safaricom sends POST to this URL
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const callback = req.body as MpesaCallback;

  try {
    const stkCallback = callback?.Body?.stkCallback;
    if (!stkCallback) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find the transaction by checkout request ID
    const [transaction] = await sql`
      SELECT t.*, b.customer_id FROM transactions t
      JOIN bookings b ON b.id = t.booking_id
      WHERE t.mpesa_checkout_request_id = ${CheckoutRequestID}
    `;

    if (!transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      // Payment successful — extract details from metadata
      const items = CallbackMetadata?.Item || [];
      const getItem = (name: string) => items.find((i: MpesaCallbackItem) => i.Name === name)?.Value;

      const mpesaReceiptNumber = getItem('MpesaReceiptNumber') as string;
      const amount = getItem('Amount') as number;

      // Update transaction
      await sql`
        UPDATE transactions SET
          status = 'completed',
          mpesa_code = ${mpesaReceiptNumber || null},
          amount = ${amount || transaction.amount}
        WHERE mpesa_checkout_request_id = ${CheckoutRequestID}
      `;

      // Update booking payment status
      await sql`
        UPDATE bookings SET
          payment_status = 'completed',
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
        WHERE id = ${transaction.booking_id}
      `;

      // Award loyalty points (10 pts per 100 KES)
      const points = Math.floor((amount || parseFloat(transaction.amount)) / 10);
      if (points > 0) {
        await sql`
          INSERT INTO loyalty_points (customer_id, booking_id, points, description)
          VALUES (${transaction.customer_id}, ${transaction.booking_id}, ${points}, 'M-Pesa payment')
          ON CONFLICT DO NOTHING
        `;
      }

      // Notify customer
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          ${transaction.customer_id},
          'Payment Confirmed',
          ${'KES ' + (amount || transaction.amount).toLocaleString() + ' received via M-Pesa. Code: ' + (mpesaReceiptNumber || 'N/A')},
          'payment'
        )
      `;

      // Notify owner
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        SELECT s.owner_id, 'Payment Received', ${'M-Pesa payment of KES ' + (amount || transaction.amount).toLocaleString() + ' received.'}, 'payment'
        FROM bookings b JOIN services s ON s.id = b.service_id
        WHERE b.id = ${transaction.booking_id}
      `;

    } else {
      // Payment failed
      await sql`
        UPDATE transactions SET status = 'failed'
        WHERE mpesa_checkout_request_id = ${CheckoutRequestID}
      `;

      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          ${transaction.customer_id},
          'Payment Failed',
          ${'M-Pesa payment failed: ' + ResultDesc + '. Please try again.'},
          'payment'
        )
      `;
    }

    // Always return success to Safaricom
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (err) {
    console.error('M-Pesa callback error:', err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
