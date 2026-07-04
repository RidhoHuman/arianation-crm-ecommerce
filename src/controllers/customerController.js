const knex = require('../config/knex');
const { sendSuccess, sendError } = require('../utils/response');
const nodemailer = require('nodemailer');

/**
 * Get list of customers and their total purchases
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = knex('user')
      .where('role', 'CUSTOMER')
      .select('id', 'fullName', 'email', 'phone', 'isActive', 'rewardPoints', 'createdAt');

    if (search) {
      query = query.where((builder) => {
        builder.where('fullName', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      });
    }

    const customers = await query.orderBy('createdAt', 'desc');

    // Enrichment: fetch from customerMetrics
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const metrics = await knex('customerMetrics').where('userId', customer.id).first();
        return {
          ...customer,
          totalOrders: metrics?.totalTransactions || 0,
          totalSpent: metrics?.totalSpent || 0,
          currentTier: metrics?.currentTier || 'BRONZE',
          loyaltyPoints: metrics?.loyaltyPoints || 0
        };
      })
    );

    sendSuccess(res, enrichedCustomers, 'Berhasil mengambil data pelanggan');
  } catch (error) {
    next(error);
  }
};

/**
 * Send promo email to selected customers
 */
const sendPromoEmail = async (req, res, next) => {
  try {
    const { customerIds, subject, message } = req.body;

    if (!subject || !message) {
      return sendError(res, 400, 'Subject dan pesan promo harus diisi');
    }

    let targetEmails = [];

    // If customerIds provided, get those specific emails. Otherwise, send to all active customers.
    if (customerIds && customerIds.length > 0) {
      const users = await knex('user')
        .whereIn('id', customerIds)
        .where('isActive', true)
        .select('email');
      targetEmails = users.map(u => u.email);
    } else {
      const users = await knex('user')
        .where('role', 'CUSTOMER')
        .where('isActive', true)
        .select('email');
      targetEmails = users.map(u => u.email);
    }

    if (targetEmails.length === 0) {
      return sendError(res, 400, 'Tidak ada target pelanggan yang valid');
    }

    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Fallback to auto-generated Ethereal account for development
      console.log('⚠️ Tidak ada SMTP_USER di .env. Membuat akun Ethereal sementara...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    // Send emails in background
    for (const email of targetEmails) {
      try {
        const info = await transporter.sendMail({
          from: `"Arianation CRM" <${process.env.SMTP_USER || 'promo@arianation.com'}>`,
          to: email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #2563eb;">Penawaran Spesial dari Arianation</h2>
              <div style="margin-top: 20px; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                Anda menerima email ini karena Anda adalah pelanggan setia Arianation.
              </div>
            </div>
          `
        });
        
        // Cek jika menggunakan Ethereal, tampilkan URL untuk melihat email
        if (info.messageId && nodemailer.getTestMessageUrl(info)) {
          console.log(`📧 Preview Email (${email}): ${nodemailer.getTestMessageUrl(info)}`);
        }
      } catch (err) {
        console.error(`Failed to send promo email to ${email}:`, err);
      }
    }

    sendSuccess(res, null, `Promo email sedang dikirim ke ${targetEmails.length} pelanggan`);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Customer CRM Data (Block, Tier, Points)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, currentTier, pointsAdjustment } = req.body;

    const user = await knex('user').where('id', id).first();
    if (!user) {
      return sendError(res, 404, 'Pelanggan tidak ditemukan');
    }

    if (isActive !== undefined) {
      await knex('user').where('id', id).update({ isActive: isActive ? 1 : 0, updatedAt: new Date() });
    }

    if (currentTier) {
      const metrics = await knex('customerMetrics').where('userId', id).first();
      if (metrics) {
        await knex('customerMetrics').where('userId', id).update({ currentTier, isTierManuallySet: true, updatedAt: new Date() });
      } else {
        await knex('customerMetrics').insert({
          id: require('cuid')(),
          userId: id,
          currentTier,
          isTierManuallySet: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (pointsAdjustment) {
      const adjustNum = Number(pointsAdjustment);
      if (adjustNum !== 0) {
        const newPoints = Math.max(0, (user.rewardPoints || 0) + adjustNum);
        await knex('user').where('id', id).update({ rewardPoints: newPoints, updatedAt: new Date() });
        
        await knex('pointHistory').insert({
          id: require('cuid')(),
          userId: id,
          points: Math.abs(adjustNum),
          type: adjustNum > 0 ? 'EARNED' : 'SPENT',
          description: 'Penyesuaian manual oleh Admin CRM',
          createdAt: new Date()
        });
      }
    }

    sendSuccess(res, null, 'Data CRM pelanggan berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  sendPromoEmail,
  updateCustomer
};
