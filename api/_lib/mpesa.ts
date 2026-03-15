/**
 * Shared M-Pesa Daraja API helpers.
 * Used by both /api/payments and /api/bookings.
 *
 * Env vars required:
 *   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY
 *   MPESA_ENV          — 'production' | 'sandbox'  (default sandbox)
 *
 * For B2C payouts (owner payouts) you additionally need:
 *   MPESA_INITIATOR_NAME        — API operator username from Daraja portal
 *   MPESA_SECURITY_CREDENTIAL   — Encrypted password from Daraja portal
 *   NEXT_PUBLIC_APP_URL         — Base URL for callbacks
 */

export const MPESA_BASE =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function getMpesaAccessToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const creds  = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export function formatTimestamp(): string {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  );
}

export function normalisePhone(phone: string): string {
  let p = phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^0/, '254');
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

/** Strip XML-unsafe characters so Daraja's XSLT pipeline doesn't choke on e.g. "Oil & Filter" */
function sanitiseDaraja(s: string): string {
  return s.replace(/&/g, 'and').replace(/[<>"']/g, '').slice(0, 100);
}

// ── STK Push ─────────────────────────────────────────────────────────────────
export interface StkPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
}

export async function initiateStkPush(
  phone: string,
  amount: number,
  bookingId: string,
  description: string,
): Promise<StkPushResult> {
  const shortcode  = process.env.MPESA_SHORTCODE!;
  const passkey    = process.env.MPESA_PASSKEY!;
  const timestamp  = formatTimestamp();
  const password   = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  // MPESA_CALLBACK_HOST must be set in Vercel env to the production URL (e.g. https://autopayk.vercel.app).
  // NEXT_PUBLIC_APP_URL is a frontend var that may be localhost in dev — don't rely on it for callbacks.
  const callbackHost =
    process.env.MPESA_CALLBACK_HOST ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://autopayk.vercel.app';
  const cbSecret = process.env.MPESA_CALLBACK_SECRET;
  const callbackUrl = `${callbackHost}/api/payments/mpesa-callback${cbSecret ? `?s=${cbSecret}` : ''}`;

  const token = await getMpesaAccessToken();
  const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      BusinessShortCode:  shortcode,
      Password:           password,
      Timestamp:          timestamp,
      TransactionType:    'CustomerPayBillOnline',
      Amount:             Math.ceil(amount),
      PartyA:             phone,
      PartyB:             shortcode,
      PhoneNumber:        phone,
      CallBackURL:        callbackUrl,
      AccountReference:   sanitiseDaraja(`AUTOPAYK-${bookingId.slice(0, 8).toUpperCase()}`),
      TransactionDesc:    sanitiseDaraja(description),
    }),
  });

  const data = await stkRes.json() as {
    ResponseCode: string;
    CheckoutRequestID: string;
    MerchantRequestID: string;
    CustomerMessage: string;
    ResponseDescription: string;
  };

  if (data.ResponseCode !== '0') {
    console.error('Daraja STK Push rejected:', JSON.stringify(data));
    throw new Error(`M-Pesa error ${data.ResponseCode}: ${data.ResponseDescription || 'STK Push failed'}`);
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
    customerMessage:   data.CustomerMessage,
  };
}

// ── STK Push Query (check payment status directly from Safaricom) ─────────────
/**
 * Queries Safaricom's Daraja API to check the status of an STK Push.
 * Use this as a fallback when the callback URL was not reached.
 *
 * ResultCode 0      = Payment successful
 * ResultCode 1032   = Cancelled by user
 * ResultCode 1037   = DS timeout (no user response)
 * ResultCode 1      = Insufficient funds
 * ResultCode 2001   = Wrong PIN
 */
export interface StkQueryResult {
  resultCode: number;
  resultDesc: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  amount?: number;
  mpesaCode?: string;
}

export async function queryStkPushStatus(
  checkoutRequestId: string,
): Promise<StkQueryResult> {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey   = process.env.MPESA_PASSKEY!;
  const timestamp = formatTimestamp();
  const password  = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const token = await getMpesaAccessToken();
  const res   = await fetch(`${MPESA_BASE}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json() as {
    ResponseCode:       string;
    ResultCode:         string | number;
    ResultDesc:         string;
    MerchantRequestID:  string;
    CheckoutRequestID:  string;
    CallbackMetadata?:  { Item: Array<{ Name: string; Value: string | number }> };
  };

  const getItem = (name: string) =>
    data.CallbackMetadata?.Item?.find(i => i.Name === name)?.Value;

  return {
    resultCode:        Number(data.ResultCode ?? -1),
    resultDesc:        data.ResultDesc || '',
    merchantRequestId: data.MerchantRequestID || '',
    checkoutRequestId: data.CheckoutRequestID || checkoutRequestId,
    amount:            getItem('Amount') as number | undefined,
    mpesaCode:         getItem('MpesaReceiptNumber') as string | undefined,
  };
}

// ── B2C Payout ────────────────────────────────────────────────────────────────
/**
 * Sends money from AutoPayKe's shortcode to the owner's M-Pesa phone.
 * Requires B2C API access to be enabled on the Daraja account.
 * Contact Safaricom Business support to activate B2C for your shortcode.
 *
 * @param ownerPhone  Normalised phone (254...)
 * @param amount      KES amount to send (integer)
 * @param bookingId   Used as a unique reference
 */
export async function initiateB2CPayout(
  ownerPhone: string,
  amount: number,
  bookingId: string,
): Promise<void> {
  const initiatorName       = process.env.MPESA_INITIATOR_NAME;
  const securityCredential  = process.env.MPESA_SECURITY_CREDENTIAL;

  if (!initiatorName || !securityCredential) {
    console.warn('B2C payout skipped: MPESA_INITIATOR_NAME / MPESA_SECURITY_CREDENTIAL not configured');
    return;
  }

  const shortcode = process.env.MPESA_SHORTCODE!;
  const callbackHost =
    process.env.MPESA_CALLBACK_HOST ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://autopayk.vercel.app';

  const token = await getMpesaAccessToken();
  const b2cRes = await fetch(`${MPESA_BASE}/mpesa/b2c/v3/paymentrequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      OriginatorConversationID: `AUTOPAYK-PAYOUT-${bookingId.slice(0, 8).toUpperCase()}-${Date.now()}`,
      InitiatorName:       initiatorName,
      SecurityCredential:  securityCredential,
      CommandID:           'BusinessPayment',
      Amount:              Math.floor(amount),
      PartyA:              shortcode,
      PartyB:              ownerPhone,
      Remarks:             sanitiseDaraja(`AutoPayKe owner payout booking ${bookingId.slice(0, 8)}`),
      QueueTimeOutURL:     `${callbackHost}/api/payments/b2c-timeout`,
      ResultURL:           `${callbackHost}/api/payments/b2c-result`,
      Occassion:           bookingId.slice(0, 8),
    }),
  });

  const data = await b2cRes.json() as { ResponseCode: string; ResponseDescription: string };
  if (data.ResponseCode !== '0') {
    console.error('B2C payout failed:', data.ResponseDescription);
  } else {
    console.log('B2C payout initiated for booking:', bookingId, 'amount:', amount);
  }
}

/**
 * After escrow is released, calculate the owner's 90% share and trigger B2C.
 * If owner has no payout phone configured, logs a warning and does nothing.
 *
 * @param ownerId    UUID of the service owner
 * @param totalPaid  Total KES collected from customer
 * @param bookingId  Booking UUID (for reference)
 * @param sqlFn      The tagged sql function (to query owner settings)
 */
export async function payoutOwnerShare(
  ownerId: string,
  totalPaid: number,
  bookingId: string,
  sqlFn: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>,
): Promise<void> {
  const [owner] = await sqlFn`
    SELECT mpesa_payout_phone, mpesa_payout_type, mpesa_payout_till,
           mpesa_payout_paybill, mpesa_payout_account
    FROM users WHERE id = ${ownerId}
  `;
  if (!owner) return;

  const payoutType  = (owner.mpesa_payout_type as string) || 'phone';
  const payoutPhone = owner.mpesa_payout_phone as string | null;

  const ownerShare = Math.floor(totalPaid * 0.9); // 90% to owner

  if (payoutType === 'phone' && payoutPhone) {
    await initiateB2CPayout(normalisePhone(payoutPhone), ownerShare, bookingId).catch(err =>
      console.error('B2C payout error:', err),
    );
  } else {
    // Till / Paybill payouts require B2B (contact Safaricom).
    // For now we log — the payout will be done manually or via B2B in a future iteration.
    console.log(
      `Owner ${ownerId} payout (${payoutType}): KES ${ownerShare} pending for booking ${bookingId}`,
    );
  }
}
