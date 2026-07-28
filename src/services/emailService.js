const nodemailer = require('nodemailer');

// Setup transporter
const createTransporter = () => {
  const email = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  if (!email || !password) {
    console.warn('⚠️ SMTP_USER or SMTP_PASS is not set in .env. Email sending will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // You can change this to 'SendGrid', 'Brevo' etc later
    auth: {
      user: email,
      pass: password,
    },
  });
};

const sendPasswordResetEmail = async (toEmail, token, fullName) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Email Mock] Would have sent reset email to ${toEmail} with token ${token}`);
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"AriaNation" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset Password Anda - AriaNation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333;">Reset Password AriaNation</h2>
        <p>Halo <strong>${fullName || 'Kustomer'}</strong>,</p>
        <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di AriaNation.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat password baru. Tautan ini hanya berlaku selama <strong>1 jam</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke browser Anda:</p>
        <p style="font-size: 14px; word-break: break-all; color: #0066cc;"><a href="${resetLink}">${resetLink}</a></p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
        <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} AriaNation. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset password email sent to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Error sending reset password email to ${toEmail}:`, error.message);
    throw new Error('Gagal mengirim email reset password. Silakan coba lagi nanti.');
  }
};

module.exports = {
  sendPasswordResetEmail,
};
