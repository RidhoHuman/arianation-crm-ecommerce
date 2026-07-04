const knex = require('../config/knex');
const { renderPromoEmail } = require('../services/emailTemplates');
const { createTransport } = require('nodemailer');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' });
    }

    const existing = await knex('newsletter_subscribers').where({ email }).first();
    if (existing) {
      if (!existing.isActive) {
        await knex('newsletter_subscribers').where({ email }).update({ isActive: true });
        return res.json({ success: true, message: 'Berhasil berlangganan kembali!' });
      }
      return res.json({ success: true, message: 'Email Anda sudah terdaftar!' });
    }

    await knex('newsletter_subscribers').insert({ email });
    
    // Create admin notification
    await knex('admin_notifications').insert({
      title: 'Pelanggan Baru!',
      message: `${email} baru saja berlangganan newsletter.`,
      type: 'NEW_SUBSCRIBER',
      isRead: false
    });
    
    res.json({ success: true, message: 'Berhasil berlangganan!' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ success: false, message: 'Gagal berlangganan. Silakan coba lagi.' });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await knex('newsletter_subscribers').orderBy('createdAt', 'desc');
    res.json({ success: true, data: subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data subscriber' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    await knex('newsletter_subscribers').where({ email }).update({ isActive: false });
    res.json({ success: true, message: 'Berhasil berhenti berlangganan' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

exports.sendPromoEmail = async (req, res) => {
  try {
    const { subject, message, useTemplate } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject dan Pesan wajib diisi' });
    }

    // Get active subscribers
    const subscribers = await knex('newsletter_subscribers').where({ isActive: true });
    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada subscriber yang aktif' });
    }

    // Create transporter based on env variables
    let transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP config missing, generating ethereal test account...');
      const testAccount = await require('nodemailer').createTestAccount();
      transporter = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      transporter = createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Prepare email HTML
    const emailData = renderPromoEmail({ subject, message, useTemplate });

    // Send emails (In a real app with thousands of users, use a queue like BullMQ)
    let successCount = 0;
    let failCount = 0;
    let previewUrl = null;

    for (const sub of subscribers) {
      try {
        const info = await transporter.sendMail({
          from: `"AriaNation" <${process.env.SMTP_USER || 'promo@arianation.com'}>`,
          to: sub.email,
          subject: subject,
          text: emailData.text,
          html: emailData.html,
        });
        
        // Log preview URL if using test account
        if (info.messageId && require('nodemailer').getTestMessageUrl(info)) {
            previewUrl = require('nodemailer').getTestMessageUrl(info);
            console.log(`📧 Preview Promo Email (${sub.email}): ${previewUrl}`);
        }
        
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${sub.email}:`, err.message);
        failCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Email promo berhasil dikirim ke ${successCount} pelanggan. ${failCount} gagal.`,
      previewUrl
    });
  } catch (error) {
    console.error('Error sending promo email:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim email promo' });
  }
};
