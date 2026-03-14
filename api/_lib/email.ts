import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,           // reuse connections — avoids reconnect overhead
  maxConnections: 3,
  socketTimeout: 10000, // fail fast if Brevo is unreachable
});

const FROM = `"AutoPayKe" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://autoflow.vercel.app';
const BRAND_COLOR = '#0ea5e9'; // sky-500
const BRAND_DARK = '#0284c7';  // sky-600

// ─── Shared Layout ────────────────────────────────────────────────────────────

function emailLayout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>AutoPayKe</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { width: 100%; background-color: #f1f5f9; padding: 32px 16px; box-sizing: border-box; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); padding: 32px 40px; text-align: center; }
    .logo-mark { display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; line-height: 48px; font-size: 24px; margin-bottom: 12px; }
    .logo-text { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
    .logo-sub { color: rgba(255,255,255,0.75); font-size: 12px; margin: 4px 0 0; }
    .body { padding: 40px; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer a { color: ${BRAND_COLOR}; text-decoration: none; }
    h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px; line-height: 1.3; }
    p { font-size: 15px; color: #475569; line-height: 1.65; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_DARK}); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; box-shadow: 0 4px 14px rgba(14,165,233,0.35); }
    .btn-outline { display: inline-block; padding: 12px 24px; background: transparent; color: ${BRAND_COLOR} !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; border: 1.5px solid ${BRAND_COLOR}; margin: 4px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
    .info-table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .info-table tr:last-child td { border-bottom: none; }
    .info-table .label { color: #94a3b8; font-weight: 500; width: 40%; }
    .info-table .value { color: #1e293b; font-weight: 600; }
    .highlight-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    .highlight-box p { margin: 0; color: #0369a1; font-size: 14px; }
    .alert-box { background: #fef9ec; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .alert-box p { margin: 0; color: #92400e; font-size: 13px; }
    .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .success-box p { margin: 0; color: #166534; font-size: 14px; }
    .danger-box { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .danger-box p { margin: 0; color: #9b1c1c; font-size: 14px; }
    .credential-box { background: #0f172a; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    .credential-box .cred-label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px; }
    .credential-box .cred-value { color: #e2e8f0; font-family: 'Courier New', monospace; font-size: 15px; margin: 0 0 16px; word-break: break-all; }
    .credential-box .cred-value:last-child { margin-bottom: 0; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .badge-blue { background: #eff6ff; color: #1d4ed8; }
    .badge-green { background: #f0fdf4; color: #15803d; }
    .badge-amber { background: #fffbeb; color: #b45309; }
    .badge-red { background: #fff5f5; color: #dc2626; }
    .status-step { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .status-step:last-child { border-bottom: none; }
    .step-dot { width: 10px; height: 10px; border-radius: 50%; background: ${BRAND_COLOR}; flex-shrink: 0; }
    .step-text { font-size: 14px; color: #475569; }
    @media only screen and (max-width: 600px) {
      .body { padding: 24px 20px; }
      .header { padding: 24px 20px; }
      .footer { padding: 20px; }
      h1 { font-size: 20px; }
      .info-table .label { width: 45%; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-mark">🚗</div>
        <p class="logo-text">AutoPayKe</p>
        <p class="logo-sub">Car Care Hub Kenya · Built on Avalanche</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>
          © ${new Date().getFullYear()} AutoPayKe — Car Care Hub Kenya<br />
          Nairobi, Kenya &nbsp;·&nbsp;
          <a href="${APP_URL}">autopayk.app</a> &nbsp;·&nbsp;
          <a href="${APP_URL}/support">Support</a>
        </p>
        <p style="margin-top:8px;">You received this email because you have an AutoPayKe account. <a href="${APP_URL}/settings">Manage notifications</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  role: 'customer' | 'detailer' | 'owner'
): Promise<void> {
  const roleMessages: Record<string, { headline: string; body: string; cta: string; ctaPath: string }> = {
    customer: {
      headline: 'Book your first car wash today',
      body: `Browse hundreds of car wash locations near you, choose your service, and pay seamlessly with M-Pesa or crypto. Your car deserves the best — and AutoPayKe makes it effortless.`,
      cta: 'Book a Car Wash',
      ctaPath: '/book',
    },
    detailer: {
      headline: 'Your detailer dashboard is ready',
      body: `You can now manage your schedule, view assigned jobs, upload before/after photos, and track your earnings — all from one place.`,
      cta: 'Go to Dashboard',
      ctaPath: '/dashboard',
    },
    owner: {
      headline: 'Your business journey starts here',
      body: `Once your account is approved by our team, you'll be able to manage locations, add staff, view bookings, and access powerful analytics for your car wash business.`,
      cta: 'Learn What to Expect',
      ctaPath: '/roadmap',
    },
  };

  const msg = roleMessages[role] || roleMessages.customer;
  const roleLabel = role === 'owner' ? 'Business Owner' : role.charAt(0).toUpperCase() + role.slice(1);

  const content = `
    <h1>Welcome to AutoPayKe, ${firstName}! 👋</h1>
    <p>We're thrilled to have you on board. Your account has been created and you're all set as a <span class="badge badge-blue">${roleLabel}</span>.</p>
    <div class="highlight-box">
      <p><strong>${msg.headline}</strong><br /><br />${msg.body}</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}${msg.ctaPath}" class="btn">${msg.cta}</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">If you have any questions, our support team is always here to help. Reply to this email or visit <a href="${APP_URL}/support" style="color:${BRAND_COLOR};">our support page</a>.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Welcome to AutoPayKe, ${firstName}!`,
    html: emailLayout(content, `Hi ${firstName}, welcome to AutoPayKe — the smart car care hub.`),
  });
}

// ─── Owner Pending Approval ───────────────────────────────────────────────────

export async function sendOwnerPendingEmail(email: string, firstName: string): Promise<void> {
  const content = `
    <h1>Application Received, ${firstName}</h1>
    <p>Thank you for applying to join AutoPayKe as a Business Owner. We've received your application and KYC documents.</p>
    <div class="alert-box">
      <p><strong>⏳ Under Review</strong><br /><br />Our team typically reviews applications within <strong>1–2 business days</strong>. We'll email you as soon as a decision is made.</p>
    </div>
    <p>While you wait, here's what happens next:</p>
    <div style="padding:0 4px;">
      <div class="status-step"><div class="step-dot"></div><div class="step-text"><strong>Review</strong> — Our team verifies your business documents and ID</div></div>
      <div class="status-step"><div class="step-dot" style="background:#94a3b8;"></div><div class="step-text"><strong>Decision</strong> — You'll receive an email with the outcome</div></div>
      <div class="status-step"><div class="step-dot" style="background:#94a3b8;"></div><div class="step-text"><strong>Onboarding</strong> — Set up your location, add staff, and go live</div></div>
    </div>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Questions? Email us at <a href="mailto:${process.env.SMTP_USER}" style="color:${BRAND_COLOR};">${process.env.SMTP_USER}</a> and reference your registered email.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AutoPayKe — Your application is under review',
    html: emailLayout(content, 'We received your business owner application and are reviewing it now.'),
  });
}

// ─── Owner Approved ───────────────────────────────────────────────────────────

export async function sendOwnerApprovedEmail(email: string, firstName: string): Promise<void> {
  const content = `
    <h1>You're approved, ${firstName}! 🎉</h1>
    <p>Great news — your AutoPayKe Business Owner account has been <strong>approved</strong>. You can now log in and start setting up your car wash business.</p>
    <div class="success-box">
      <p><strong>✅ Account Active</strong><br /><br />Your dashboard is ready. Add your location, set up services, manage your team, and start accepting bookings today.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/login" class="btn">Go to Your Dashboard</a>
    </div>
    <p style="font-size:14px;color:#475569;"><strong>Quick start checklist:</strong></p>
    <table class="info-table">
      <tr><td class="label">📍 Add Location</td><td class="value">Register your car wash address</td></tr>
      <tr><td class="label">🧹 Create Services</td><td class="value">Define wash packages and pricing</td></tr>
      <tr><td class="label">👥 Add Staff</td><td class="value">Invite your detailers</td></tr>
      <tr><td class="label">📅 Go Live</td><td class="value">Start accepting customer bookings</td></tr>
    </table>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Need help getting started? Visit our <a href="${APP_URL}/roadmap" style="color:${BRAND_COLOR};">feature roadmap</a> or contact support.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AutoPayKe — Your account has been approved! 🎉',
    html: emailLayout(content, 'Your AutoPayKe business owner account is approved and ready to go.'),
  });
}

// ─── Owner Rejected ───────────────────────────────────────────────────────────

export async function sendOwnerRejectedEmail(email: string, firstName: string): Promise<void> {
  const content = `
    <h1>An update on your application</h1>
    <p>Hi ${firstName}, thank you for your interest in joining AutoPayKe as a Business Owner.</p>
    <div class="danger-box">
      <p><strong>Application Not Approved</strong><br /><br />After reviewing your application, we were unable to approve your account at this time. This may be due to incomplete documentation or information that couldn't be verified.</p>
    </div>
    <p>You can re-apply with updated documents, or contact our support team if you believe this is an error.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/register" class="btn-outline">Re-apply</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">For questions about this decision, contact us at <a href="mailto:${process.env.SMTP_USER}" style="color:${BRAND_COLOR};">${process.env.SMTP_USER}</a>. Please include your registered email address.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AutoPayKe — Update on your business owner application',
    html: emailLayout(content, 'We have an update regarding your AutoPayKe business owner application.'),
  });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string, resetUrl: string): Promise<void> {
  const content = `
    <h1>Reset your password</h1>
    <p>We received a request to reset the password for your AutoPayKe account. Click the button below — this link expires in <strong>1 hour</strong>.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>
    <div class="alert-box">
      <p>🔒 <strong>Security tip:</strong> If you didn't request this, please ignore this email. Your password will not change unless you click the button above.</p>
    </div>
    <p style="font-size:13px;color:#94a3b8;">Or copy and paste this link into your browser:<br /><a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${resetUrl}</a></p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AutoPayKe — Reset your password',
    html: emailLayout(content, 'You requested a password reset for your AutoPayKe account.'),
  });
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

export async function sendBookingConfirmation(
  email: string,
  customerName: string,
  data: {
    bookingId?: string;
    serviceName: string;
    locationName: string;
    date: string;
    time: string;
    amount: number;
    paymentMethod?: string;
    vehicleName?: string;
  }
): Promise<void> {
  const paymentLabel: Record<string, string> = {
    mpesa: 'M-Pesa', usdt: 'USDT', usdc: 'USDC', crypto: 'Crypto', card: 'Card', cash: 'Cash on Arrival',
  };

  const content = `
    <h1>Booking Confirmed ✅</h1>
    <p>Hi ${customerName}, your car wash booking has been confirmed. Here's everything you need to know.</p>
    <table class="info-table">
      ${data.bookingId ? `<tr><td class="label">Booking ID</td><td class="value">#${data.bookingId}</td></tr>` : ''}
      <tr><td class="label">Service</td><td class="value">${data.serviceName}</td></tr>
      ${data.vehicleName ? `<tr><td class="label">Vehicle</td><td class="value">${data.vehicleName}</td></tr>` : ''}
      <tr><td class="label">Location</td><td class="value">${data.locationName}</td></tr>
      <tr><td class="label">Date</td><td class="value">${data.date}</td></tr>
      <tr><td class="label">Time</td><td class="value">${data.time}</td></tr>
      <tr><td class="label">Amount</td><td class="value">KES ${data.amount.toLocaleString()}</td></tr>
      ${data.paymentMethod ? `<tr><td class="label">Payment</td><td class="value">${paymentLabel[data.paymentMethod] || data.paymentMethod}</td></tr>` : ''}
    </table>
    <div class="highlight-box">
      <p>📍 <strong>Arriving soon?</strong> Our detailer will be ready for you. You'll receive another notification when your service starts.</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/bookings" class="btn-outline">View My Bookings</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Need to cancel or reschedule? Visit your bookings page or contact the location directly. Cancellations are accepted up to 2 hours before your appointment.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Booking Confirmed — ${data.serviceName} at ${data.locationName}`,
    html: emailLayout(content, `Your ${data.serviceName} booking at ${data.locationName} is confirmed for ${data.date}.`),
  });
}

// ─── Booking Status Update ────────────────────────────────────────────────────

export async function sendBookingStatusEmail(
  email: string,
  customerName: string,
  status: 'confirmed' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled' | string,
  data: {
    serviceName: string;
    locationName: string;
    date: string;
    loyaltyPoints?: number;
    payAtPickup?: boolean;
  }
): Promise<void> {
  const configs: Record<string, { subject: string; headline: string; icon: string; box: string; message: string; cta?: string; ctaPath?: string }> = {
    confirmed: {
      subject: `Booking confirmed — ${data.serviceName}`,
      headline: 'Your booking is confirmed',
      icon: '✅',
      box: 'success-box',
      message: `Great news! Your <strong>${data.serviceName}</strong> at <strong>${data.locationName}</strong> on <strong>${data.date}</strong> has been confirmed by the team. See you soon!`,
      cta: 'View Booking',
      ctaPath: '/bookings',
    },
    in_progress: {
      subject: `Your service has started — ${data.serviceName}`,
      headline: 'Your service is underway',
      icon: '🚿',
      box: 'highlight-box',
      message: `Your <strong>${data.serviceName}</strong> at <strong>${data.locationName}</strong> has started. Our detailer is working on your car right now. Sit back and relax!`,
      cta: 'Track Progress',
      ctaPath: '/bookings',
    },
    awaiting_confirmation: {
      subject: `Your car is ready for pickup — ${data.serviceName}`,
      headline: data.payAtPickup ? 'Your car is ready — time to pay & confirm!' : 'Your car is ready for pickup!',
      icon: '🚗',
      box: 'success-box',
      message: data.payAtPickup
        ? `Your <strong>${data.serviceName}</strong> at <strong>${data.locationName}</strong> is complete and looking great! Please open the AutoPayKe app, confirm the service, and complete your payment to release the car.`
        : `Your <strong>${data.serviceName}</strong> at <strong>${data.locationName}</strong> is complete and looking great! Please check the after-photos in the app and tap <strong>Confirm Pickup</strong> to release payment to the car wash team.`,
      cta: data.payAtPickup ? 'Pay & Confirm Pickup' : 'Confirm Pickup',
      ctaPath: '/customer/bookings',
    },
    completed: {
      subject: `Service complete — ${data.serviceName}`,
      headline: 'Service confirmed — thank you!',
      icon: '🎉',
      box: 'success-box',
      message: `Your <strong>${data.serviceName}</strong> is complete and payment has been released. We hope your car looks amazing! ${data.loyaltyPoints ? `You've earned <strong>${data.loyaltyPoints} loyalty points</strong> for this booking.` : ''}`,
      cta: 'Book Again',
      ctaPath: '/customer/book',
    },
    cancelled: {
      subject: `Booking cancelled — ${data.serviceName}`,
      headline: 'Booking cancelled',
      icon: '❌',
      box: 'danger-box',
      message: `Your <strong>${data.serviceName}</strong> booking at <strong>${data.locationName}</strong> on <strong>${data.date}</strong> has been cancelled. If this was unexpected, please contact support.`,
      cta: 'Book Again',
      ctaPath: '/customer/book',
    },
  };

  const cfg = configs[status];
  if (!cfg) return;

  const content = `
    <h1>${cfg.icon} ${cfg.headline}</h1>
    <p>Hi ${customerName},</p>
    <div class="${cfg.box}">
      <p>${cfg.message}</p>
    </div>
    <table class="info-table">
      <tr><td class="label">Service</td><td class="value">${data.serviceName}</td></tr>
      <tr><td class="label">Location</td><td class="value">${data.locationName}</td></tr>
      <tr><td class="label">Date</td><td class="value">${data.date}</td></tr>
      ${data.loyaltyPoints ? `<tr><td class="label">Points Earned</td><td class="value"><span class="badge badge-blue">+${data.loyaltyPoints} pts</span></td></tr>` : ''}
    </table>
    ${cfg.cta ? `<div style="text-align:center;margin:24px 0;"><a href="${APP_URL}${cfg.ctaPath}" class="btn">${cfg.cta}</a></div>` : ''}
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `AutoPayKe — ${cfg.subject}`,
    html: emailLayout(content),
  });
}

// ─── Staff Credentials ────────────────────────────────────────────────────────

export async function sendStaffCredentials(
  email: string,
  firstName: string,
  password: string,
  ownerBusinessName?: string
): Promise<void> {
  const content = `
    <h1>Welcome to the team, ${firstName}!</h1>
    <p>${ownerBusinessName ? `<strong>${ownerBusinessName}</strong> has added you` : 'You have been added'} as a detailer on AutoPayKe. Your account is ready — here are your login credentials.</p>
    <div class="credential-box">
      <p class="cred-label">Email</p>
      <p class="cred-value">${email}</p>
      <p class="cred-label">Temporary Password</p>
      <p class="cred-value">${password}</p>
    </div>
    <div class="alert-box">
      <p>⚠️ <strong>Important:</strong> Please log in and change your password immediately. This temporary password should not be shared with anyone.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/login" class="btn">Log In Now</a>
    </div>
    <p style="font-size:14px;color:#475569;"><strong>As a detailer you can:</strong></p>
    <table class="info-table">
      <tr><td class="label">📅 Schedule</td><td class="value">Manage your weekly availability</td></tr>
      <tr><td class="label">🔧 Jobs</td><td class="value">View and track assigned bookings</td></tr>
      <tr><td class="label">📸 Photos</td><td class="value">Upload before/after work photos</td></tr>
      <tr><td class="label">💰 Earnings</td><td class="value">Track your earnings over time</td></tr>
    </table>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Questions? Contact your business owner or reach AutoPayKe support at <a href="mailto:${process.env.SMTP_USER}" style="color:${BRAND_COLOR};">${process.env.SMTP_USER}</a></p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'AutoPayKe — Your detailer account is ready',
    html: emailLayout(content, `${firstName}, your AutoPayKe detailer account is live. Here are your login credentials.`),
  });
}

// ─── Loyalty Milestone ────────────────────────────────────────────────────────

export async function sendLoyaltyMilestoneEmail(
  email: string,
  firstName: string,
  totalPoints: number,
  milestone: number
): Promise<void> {
  const milestoneRewards: Record<number, string> = {
    100: '10% off your next booking',
    250: 'One free basic wash',
    500: '20% off any premium service',
    1000: 'Free full detailing session',
  };

  const reward = milestoneRewards[milestone] || `a special reward for reaching ${milestone} points`;

  const content = `
    <h1>You've hit ${milestone} points! 🌟</h1>
    <p>Hi ${firstName}, congratulations — you've reached a loyalty milestone on AutoPayKe!</p>
    <div class="success-box">
      <p><strong>🎁 Your reward: ${reward}</strong><br /><br />This reward has been added to your account and will be automatically applied at checkout on your next eligible booking.</p>
    </div>
    <table class="info-table">
      <tr><td class="label">Total Points</td><td class="value"><span class="badge badge-blue">${totalPoints} pts</span></td></tr>
      <tr><td class="label">Milestone Reached</td><td class="value">${milestone} pts</td></tr>
      <tr><td class="label">Reward</td><td class="value">${reward}</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/book" class="btn">Book a Car Wash</a>
    </div>
    <p style="font-size:13px;color:#94a3b8;">Keep earning points with every booking. The more you wash, the more you save! View your full points history in your dashboard.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `AutoPayKe — You've earned ${milestone} loyalty points! 🌟`,
    html: emailLayout(content, `Congrats! You've reached ${milestone} loyalty points on AutoPayKe.`),
  });
}

// ─── Waitlist Confirmation ────────────────────────────────────────────────────

export async function sendWaitlistConfirmationEmail(
  email: string,
  name: string | null,
  role: string,
  tier: string | null
): Promise<void> {
  const firstName = name ? name.split(' ')[0] : 'there';
  const tierLabel: Record<string, { label: string; desc: string }> = {
    economy:     { label: 'Economy',     desc: 'Affordable everyday washes from KSh 300–1,000' },
    first_class: { label: 'First Class', desc: 'Quality washes from KSh 1,000–2,000' },
    premium:     { label: 'Premium',     desc: 'Full detailing & premium care from KSh 1,500–4,000' },
  };

  const roleMessages: Record<string, { headline: string; body: string; what: string }> = {
    car_owner: {
      headline: `You're on the list, ${firstName}! 🚗`,
      body: `We're almost ready to launch. When we go live, you'll be among the first to book a car wash near you — pay with M-Pesa and get it done in minutes.`,
      what: 'As a Car Owner you\'ll be able to browse nearby car washes, compare prices, book in seconds, and pay with M-Pesa or card.',
    },
    owner: {
      headline: `Your car wash is almost on the map, ${firstName}! 🏢`,
      body: `We're building the platform that will power your business. When we launch, you'll register your car wash, manage bookings, pay your team, and grow — all in one dashboard.`,
      what: 'As a Business Owner you\'ll get your own dashboard to manage locations, services, staff, bookings, and payouts.',
    },
    detailer: {
      headline: `Jobs are coming your way, ${firstName}! 🔧`,
      body: `We're almost live. Once we launch, you'll be assigned jobs from nearby car washes, track your earnings, and get paid via M-Pesa — no chasing payments.`,
      what: 'As a Detailer you\'ll manage your schedule, receive job notifications, upload before/after photos, and get your 40% payout automatically.',
    },
  };

  const msg = roleMessages[role] || roleMessages.car_owner;
  const tierInfo = tier ? tierLabel[tier] : null;

  const content = `
    <h1>${msg.headline}</h1>
    <p>${msg.body}</p>
    <div class="success-box">
      <p>✅ <strong>You're on the waitlist.</strong><br /><br />We'll send you a personal email the moment AutoPayKe goes live — with a step-by-step guide to get you started immediately.</p>
    </div>
    ${tierInfo ? `
    <div class="highlight-box">
      <p>🏷️ <strong>${tierInfo.label} Tier selected</strong><br /><br />${tierInfo.desc}. Great choice — we'll make sure there are plenty of options in your range when we launch.</p>
    </div>
    ` : ''}
    <hr class="divider" />
    <p style="font-size:15px;font-weight:600;color:#0f172a;margin-bottom:8px;">What to expect when we launch</p>
    <p style="font-size:14px;color:#475569;">${msg.what}</p>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Follow our progress or tell a friend — the more people on the waitlist, the sooner we launch in your area. 🙌<br /><br />Questions? Reply to this email — we actually read every one.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You're on the AutoPayKe waitlist!`,
    html: emailLayout(content, `Welcome to the waitlist, ${firstName} — we'll be in touch when we go live.`),
  });
}

// ─── Waitlist Announcement ────────────────────────────────────────────────────

export async function sendWaitlistAnnouncementEmail(
  email: string,
  name: string | null,
  role: string,
  tier: string | null
): Promise<void> {
  const firstName = name ? name.split(' ')[0] : 'there';
  const tierLabel: Record<string, string> = {
    economy: 'Economy', first_class: 'First Class', premium: 'Premium',
  };

  const roleContent: Record<string, { subject: string; preheader: string; headline: string; sub: string; steps: { icon: string; title: string; desc: string }[]; cta: string; ctaPath: string }> = {
    car_owner: {
      subject: 'AutoPayKe is live — book your first wash 🚗',
      preheader: 'The easiest way to get your car washed in Nairobi is finally here.',
      headline: `Your car deserves the best, ${firstName}`,
      sub: 'AutoPayKe is officially live! Here\'s how to get your first wash in under 3 minutes.',
      steps: [
        { icon: '👤', title: 'Create your profile', desc: 'Sign up at AutoPayKe and complete your profile with your contact details.' },
        { icon: '🚗', title: 'Add your vehicle', desc: 'Add your car(s) — make, model, colour. We\'ll remember them for every booking.' },
        { icon: '📍', title: 'Choose a car wash near you', desc: 'Browse verified car washes in your area, compare prices, and pick a time that works.' },
        { icon: '💳', title: 'Pay with M-Pesa or card', desc: 'Pay instantly — M-Pesa STK Push lands on your phone, approve it and you\'re done.' },
        { icon: '✅', title: 'Confirm pickup', desc: 'After your wash, confirm the service in the app. Payment releases to the car wash only when you\'re happy.' },
      ],
      cta: 'Book My First Wash',
      ctaPath: '/register',
    },
    owner: {
      subject: 'AutoPayKe is live — register your car wash now 🏢',
      preheader: 'Start accepting bookings and managing your car wash business digitally.',
      headline: `Grow your car wash with AutoPayKe, ${firstName}`,
      sub: 'We\'re live! Here\'s how to get your car wash on the platform and start accepting bookings today.',
      steps: [
        { icon: '📝', title: 'Create your business account', desc: 'Sign up as a Business Owner and complete your profile with your business details.' },
        { icon: '📋', title: 'Submit KYC documents', desc: 'Upload your ID and business documents. Our team reviews and approves within 1–2 business days.' },
        { icon: '📍', title: 'Register your location', desc: 'Add your car wash address, operating hours, and photos so customers can find you.' },
        { icon: '🧹', title: 'Set up your services', desc: 'Define your wash packages — name, description, duration, and pricing.' },
        { icon: '👥', title: 'Add your detailers', desc: 'Invite your staff as detailers. They get a login and can manage their own schedule.' },
        { icon: '💰', title: 'Configure M-Pesa payments', desc: 'Payments from customers flow through AutoPayKe. Your 90% share is settled weekly via M-Pesa.' },
      ],
      cta: 'Register My Car Wash',
      ctaPath: '/register',
    },
    detailer: {
      subject: 'AutoPayKe is live — start earning now 🔧',
      preheader: 'Get jobs assigned to you, track earnings, and get paid via M-Pesa.',
      headline: `Ready to start earning, ${firstName}?`,
      sub: 'AutoPayKe is officially live! Here\'s everything you need to know to start working and getting paid.',
      steps: [
        { icon: '📝', title: 'Complete your profile', desc: 'Log in and fill in your profile — your skills, experience, and a profile photo help you get more jobs.' },
        { icon: '📅', title: 'Set your availability', desc: 'Update your weekly schedule so the system knows when you\'re available to take jobs.' },
        { icon: '🔔', title: 'How job assignment works', desc: 'When a customer books at your car wash, the system assigns the job to you based on your schedule. You\'ll get a notification immediately.' },
        { icon: '📸', title: 'Upload before & after photos', desc: 'When you start and complete a job, take photos through the app. This protects you and builds your reputation.' },
        { icon: '💰', title: 'Getting paid via M-Pesa', desc: 'You earn 40% of the service price. Payments are released after the customer confirms the job — typically within minutes.' },
      ],
      cta: 'Go to My Dashboard',
      ctaPath: '/login',
    },
  };

  const cfg = roleContent[role] || roleContent.car_owner;
  const tierBadge = tier && tierLabel[tier]
    ? `<span style="display:inline-block;padding:3px 12px;border-radius:99px;background:#1e293b;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-left:8px;">${tierLabel[tier]} Tier</span>`
    : '';

  const stepsHtml = cfg.steps.map(s => `
    <div style="display:flex;gap:16px;padding:14px 0;border-bottom:1px solid #f1f5f9;">
      <div style="font-size:22px;line-height:1;flex-shrink:0;width:32px;text-align:center;">${s.icon}</div>
      <div>
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0f172a;">${s.title}</p>
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">${s.desc}</p>
      </div>
    </div>
  `).join('');

  const content = `
    <h1>🚀 AutoPayKe is Live!${tierBadge}</h1>
    <p>${cfg.sub}</p>
    <div class="success-box">
      <p><strong>${cfg.headline}</strong><br /><br />You were one of the first to join our waitlist — thank you for believing in what we're building. Now let's get to work.</p>
    </div>
    <hr class="divider" />
    <p style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px;">How to get started</p>
    <div style="padding:0 4px;">
      ${stepsHtml}
    </div>
    <div style="text-align:center;margin:32px 0;">
      <a href="${APP_URL}${cfg.ctaPath}" class="btn">${cfg.cta} →</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Questions? Our team is ready to help. Reply to this email or visit <a href="${APP_URL}/support" style="color:${BRAND_COLOR};">our support page</a>. We're building this for you and we want your feedback.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: cfg.subject,
    html: emailLayout(content, cfg.preheader),
  });
}

// ─── Generic Notification ─────────────────────────────────────────────────────

export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string
): Promise<void> {
  const content = `
    <h1>${title}</h1>
    <p>${message}</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/dashboard" class="btn-outline">Go to Dashboard</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `AutoPayKe — ${title}`,
    html: emailLayout(content),
  });
}
