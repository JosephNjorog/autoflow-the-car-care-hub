/**
 * Test Brevo HTTP API email delivery (no SMTP — bypasses Vercel port block).
 * Run: node scripts/test-email.mjs
 */

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

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SMTP_USER     = process.env.SMTP_USER || 'synchstacklabs@gmail.com';
const TO            = 'mwangijoenjoroge@gmail.com';

console.log('\n─────────────────────────────────────────');
console.log('  AutoPayKe — Brevo HTTP API email test');
console.log('─────────────────────────────────────────');
console.log(`🔑  API key : ${BREVO_API_KEY ? BREVO_API_KEY.slice(0, 22) + '...' : 'NOT SET ❌'}`);
console.log(`📤  From    : ${SMTP_USER}`);
console.log(`📥  To      : ${TO}`);
console.log(`🌐  Via     : https://api.brevo.com/v3/smtp/email\n`);

if (!BREVO_API_KEY) {
  console.error('❌  BREVO_API_KEY is not set in .env.local — aborting.');
  process.exit(1);
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin:0; padding:0; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .hdr { background:linear-gradient(135deg,#0ea5e9,#0284c7); padding:28px 36px; text-align:center; }
    .hdr h1 { color:#fff; margin:0; font-size:22px; letter-spacing:-.5px; }
    .hdr p { color:rgba(255,255,255,.75); margin:4px 0 0; font-size:12px; }
    .body { padding:36px; }
    .body h2 { color:#0f172a; margin:0 0 12px; font-size:20px; }
    .body p { color:#475569; line-height:1.65; font-size:15px; margin:0 0 14px; }
    .ok { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px; }
    .ok p { margin:0; color:#166534; font-size:14px; }
    .footer { padding:20px 36px; text-align:center; border-top:1px solid #e2e8f0; }
    .footer p { margin:0; color:#94a3b8; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>🚗 AutoPayKe</h1>
      <p>Car Care Hub Kenya</p>
    </div>
    <div class="body">
      <h2>Email delivery test ✅</h2>
      <p>Sent via <strong>Brevo HTTP API</strong> at <strong>${new Date().toUTCString()}</strong>.</p>
      <p>If you're reading this, the Brevo API key is valid and email delivery is working correctly on Vercel.</p>
      <div class="ok">
        <p>
          ✓ Brevo HTTP API connected<br />
          ✓ Verified sender: <strong>${SMTP_USER}</strong><br />
          ✓ No SMTP — no Vercel port-block issue<br />
          ✓ Production-ready
        </p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AutoPayKe · autoflowbuzz.vercel.app</p>
    </div>
  </div>
</body>
</html>
`;

try {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:      { name: 'AutoPayKe', email: SMTP_USER },
      to:          [{ email: TO }],
      subject:     `AutoPayKe — Email test ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}`,
      htmlContent,
    }),
  });

  const body = await res.text();

  if (res.ok) {
    console.log(`✅  Email sent! HTTP ${res.status}`);
    console.log(`    ${body}`);
    console.log(`\n📬  Check ${TO} inbox (and spam/promotions tabs).`);
    console.log('\n🎉  Brevo HTTP API is working. All emails will now deliver on Vercel.\n');
  } else {
    console.error(`❌  Brevo API returned HTTP ${res.status}:`);
    console.error(`    ${body}`);
    process.exit(1);
  }
} catch (err) {
  console.error('❌  Network error:', err.message);
  process.exit(1);
}
