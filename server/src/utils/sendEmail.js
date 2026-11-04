const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // Gmail configuration
  if (
    process.env.EMAIL_SERVICE === 'gmail' ||
    (!process.env.SMTP_HOST && user && user.includes('@gmail.com'))
  ) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  // Custom or standard SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    auth: {
      user,
      pass,
    },
  });
};

const sendVerificationEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === 'test') {
      console.log(`[Test Mode Email]: OTP ${otp} sent to ${to}`);
      return { messageId: 'test-message-id', response: '250 Test OK' };
    }
    const errorMsg =
      'Email service credentials not configured. Please set EMAIL_USER and EMAIL_PASS (Gmail App Password) in server/.env.';
    console.error(`[Nodemailer Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const fromAddress = process.env.EMAIL_FROM || `TravelEase <${process.env.EMAIL_USER}>`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #0d9488 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">TravelEase</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Secure Account Email Verification</p>
      </div>
      <div style="padding: 32px 28px; color: #334155; line-height: 1.6;">
        <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Hello ${name || 'Traveler'},</h2>
        <p style="font-size: 14px; margin-bottom: 20px;">
          Thank you for signing up with <strong>TravelEase</strong>. To complete your registration and activate your account, please enter the following 6-digit verification code:
        </p>
        
        <div style="background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f766e; font-family: monospace;">${otp}</span>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 12px; color: #92400e;">
          <strong>Important:</strong> This verification code expires in <strong>5 minutes</strong>. Do not share this OTP with anyone.
        </div>

        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
          If you did not initiate this registration, please ignore this email.
        </p>
      </div>
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} TravelEase Portal. All rights reserved.
      </div>
    </div>
  `;

  const mailOptions = {
    from: fromAddress,
    to,
    subject: `Your TravelEase Verification Code: ${otp}`,
    text: `Hello ${name || 'Traveler'},\n\nYour TravelEase verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nTravelEase Team`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = {
  sendVerificationEmail,
};
