import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"AutoFlow" <${process.env.SMTP_USER}>`;

export async function sendPasswordReset(email: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset Your AutoFlow Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a3d;">Reset Your Password</h2>
        <p>You requested a password reset for your AutoFlow account.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2d5a3d; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmation(
  email: string,
  customerName: string,
  data: {
    serviceName: string;
    locationName: string;
    date: string;
    time: string;
    amount: number;
  }
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Booking Confirmed — ${data.serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a3d;">Booking Confirmed!</h2>
        <p>Hi ${customerName},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Service</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.serviceName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.locationName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Date & Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.date} at ${data.time}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Amount</td><td style="padding: 8px; font-weight: bold;">KES ${data.amount.toLocaleString()}</td></tr>
        </table>
        <p>Thank you for choosing AutoFlow!</p>
      </div>
    `,
  });
}

export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `AutoFlow — ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a3d;">${title}</h2>
        <p>${message}</p>
      </div>
    `,
  });
}
