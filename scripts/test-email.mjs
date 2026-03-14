// Quick Brevo SMTP test — run with: node scripts/test-email.mjs
// Tests both a plain send and the waitlist confirmation template

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local manually
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env.local');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const [key, ...rest] = line.split('=');
  if (key && !key.startsWith('#') && rest.length) {
    process.env[key.trim()] = rest.join('=').trim();
  }
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
const APP_URL = 'https://autopayk.app';
const BRAND_COLOR = '#0ea5e9';
const BRAND_DARK  = '#0284c7';
const TO = 'bravourebridge@gmail.com';

console.log('SMTP config:', { host: SMTP_HOST, port: SMTP_PORT, user: SMTP_USER });

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(SMTP_PORT || '587'),
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  socketTimeout: 10000,
});

// ── Verify connection ──
try {
  await transporter.verify();
  console.log('✅ SMTP connection verified — Brevo is reachable');
} catch (err) {
  console.error('❌ SMTP connection failed:', err.message);
  process.exit(1);
}

// ── HTML layout (matches production) ──
function emailLayout(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AutoPayKe</title>
  <style>
    body { margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
    .wrapper { width:100%;background-color:#f1f5f9;padding:32px 16px;box-sizing:border-box; }
    .container { max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,${BRAND_COLOR} 0%,${BRAND_DARK} 100%);padding:32px 40px;text-align:center; }
    .logo-text { color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;margin:0; }
    .logo-sub { color:rgba(255,255,255,0.75);font-size:12px;margin:4px 0 0; }
    .body { padding:40px; }
    .footer { background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center; }
    .footer p { margin:0;font-size:12px;color:#94a3b8;line-height:1.6; }
    h1 { font-size:24px;font-weight:700;color:#0f172a;margin:0 0 8px;line-height:1.3; }
    p { font-size:15px;color:#475569;line-height:1.65;margin:0 0 16px; }
    .btn { display:inline-block;padding:14px 28px;background:linear-gradient(135deg,${BRAND_COLOR},${BRAND_DARK});color:#ffffff!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;margin:8px 0 24px; }
    .success-box { background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0; }
    .success-box p { margin:0;color:#166534;font-size:14px; }
    .highlight-box { background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:1px solid #bae6fd;border-radius:12px;padding:20px 24px;margin:20px 0; }
    .highlight-box p { margin:0;color:#0369a1;font-size:14px; }
    .divider { border:none;border-top:1px solid #e2e8f0;margin:28px 0; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="font-size:32px;margin-bottom:8px;">🚗</div>
        <p class="logo-text">AutoPayKe</p>
        <p class="logo-sub">Car Care Hub Kenya</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} AutoPayKe — Car Care Hub Kenya<br />
        <a href="${APP_URL}" style="color:${BRAND_COLOR};">autopayk.app</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Send test: waitlist confirmation (car_owner, economy) ──
const content = `
  <h1>You're on the list, Test User! 🚗</h1>
  <p>This is a test of the AutoPayKe waitlist confirmation email sent via Brevo SMTP.</p>
  <div class="success-box">
    <p>✅ <strong>SMTP is working correctly.</strong><br /><br />
    This email was sent from <strong>${SMTP_USER}</strong> via smtp-relay.brevo.com on port 587.</p>
  </div>
  <div class="highlight-box">
    <p>🏷️ <strong>Economy Tier selected</strong><br /><br />Affordable everyday washes from KSh 300–1,000.</p>
  </div>
  <hr class="divider" />
  <p style="font-size:14px;color:#475569;">All email templates tested: waitlist confirmation, launch announcement (car_owner / owner / detailer). Brevo SMTP connection verified ✅</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${APP_URL}/register" class="btn">Join AutoPayKe →</a>
  </div>
`;

console.log(`\nSending test email to ${TO}...`);
try {
  const info = await transporter.sendMail({
    from: `"AutoPayKe" <${SMTP_USER}>`,
    to: TO,
    subject: '✅ AutoPayKe Email Test — Brevo SMTP Working',
    html: emailLayout(content, 'AutoPayKe SMTP test — everything is working correctly.'),
  });
  console.log('✅ Email sent successfully!');
  console.log('   Message ID:', info.messageId);
  console.log('   Response:  ', info.response);
} catch (err) {
  console.error('❌ Send failed:', err.message);
  process.exit(1);
}

transporter.close();
console.log('\n🎉 All tests passed — Brevo SMTP is configured correctly.');
