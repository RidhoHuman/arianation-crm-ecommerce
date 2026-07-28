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
      isRead: false,
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

// Background job processor
const processPromoBlast = async (subscribers, subject, emailData) => {
  console.log(`[PromoBlast] Starting background job for ${subscribers.length} subscribers...`);

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('[PromoBlast] Missing SMTP credentials! Aborting job.');
    return;
  }

  const transporter = createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  let successCount = 0;
  let failCount = 0;

  // Process in chunks (simulated batching)
  const batchSize = 10;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    // Process batch concurrently
    const promises = batch.map(async (sub) => {
      try {
        await transporter.sendMail({
          from: `"${process.env.STORE_NAME || 'Arianation E-Commerce'}" <${user}>`,
          to: sub.email,
          subject: subject,
          text: emailData.text,
          html: emailData.html,
        });

        // Push notification to user account if they have one
        const userRec = await knex('user').where('email', sub.email).first();
        if (userRec) {
          const cuid = require('cuid');
          await knex('orderNotification')
            .insert({
              id: cuid(),
              orderId: 'PROMO', // Differentiate from actual order
              userId: userRec.id,
              type: 'PROMO',
              title: subject,
              message: 'Promo Baru! Cek email Anda untuk info selengkapnya.',
              emailSent: true,
              createdAt: new Date(),
            })
            .catch(() => {}); // Ignore errors if table structure is strict
        }

        return true;
      } catch (err) {
        console.error(`[PromoBlast] Failed to send to ${sub.email}:`, err.message);
        return false;
      }
    });

    const results = await Promise.all(promises);
    successCount += results.filter((r) => r).length;
    failCount += results.filter((r) => !r).length;

    // Tiny delay between batches to avoid rate limits
    if (i + batchSize < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[PromoBlast] Job completed. Success: ${successCount}, Failed: ${failCount}`);

  // Save log/report to database (optional)
  await knex('admin_notifications').insert({
    title: 'Laporan Blast Promo',
    message: `Blast promo "${subject}" selesai. Berhasil: ${successCount}, Gagal: ${failCount}`,
    type: 'SYSTEM',
    isRead: false,
  });
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

    // Prepare email HTML
    const emailData = renderPromoEmail({ subject, message, useTemplate });

    // Start background job WITHOUT awaiting
    processPromoBlast(subscribers, subject, emailData).catch((err) => {
      console.error('[PromoBlast] Background job crashed:', err);
    });

    // Return 202 Accepted immediately
    res.status(202).json({
      success: true,
      message: `Proses pengiriman blast promo ke ${subscribers.length} pelanggan sedang berjalan di latar belakang.`,
    });
  } catch (error) {
    console.error('Error initiating promo blast:', error);
    res.status(500).json({ success: false, message: 'Gagal memulai pengiriman email promo' });
  }
};
