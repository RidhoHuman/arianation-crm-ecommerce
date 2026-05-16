const prisma = require('../config/database');
const nodemailer = require('nodemailer');
const { enqueueNotification } = require('./notificationQueue');
const { renderOrderNotificationEmail } = require('./emailTemplates');

const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@arianation.local';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    // Return null transporter to fallback to console logging
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Queue a notification record in DB
 * @param {Object} params { orderId, userId, recipientEmail, type, title, message }
 * @returns {Promise<Object>} created notification
 */
const queueNotification = async ({ orderId, userId = null, recipientEmail = null, type, title, message }) => {
  if (!orderId) {
    throw new Error('orderId is required to queue a notification');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, userId: true },
  });

  if (!order) {
    throw new Error(`Order not found for orderId: ${orderId}`);
  }

  const customer = await prisma.user.findUnique({
    where: { id: userId || order.userId },
    select: { id: true, email: true, fullName: true },
  });

  const notification = await prisma.orderNotification.create({
    data: {
      orderId,
      userId: userId || order.userId || null,
      recipientEmail: recipientEmail || customer?.email || null,
      type,
      title,
      message,
      emailSent: false,
    },
  });

  return notification;
};

/**
 * Send notification email by notification id
 * If SMTP not configured, log to console and mark as sent
 */
const sendOrderNotification = async (notificationId) => {
  return enqueueNotification(async () => {
    const notification = await prisma.orderNotification.findUnique({
      where: { id: notificationId },
      include: { order: true },
    });

    if (!notification) throw new Error('Notification not found');

    const transporter = createTransporter();

    const customer = notification.userId
      ? await prisma.user.findUnique({
          where: { id: notification.userId },
          select: { id: true, email: true, fullName: true },
        })
      : null;

    const to = notification.recipientEmail || customer?.email || null;
    const email = renderOrderNotificationEmail({
      notification,
      customer,
      order: notification.order,
    });

    if (!transporter) {
      // Fallback: log
      console.log('==== Notification (no SMTP configured) ====');
      console.log('To:', to || '(no recipient)');
      console.log('Subject:', email.subject);
      console.log('Text:', email.text);

      await prisma.orderNotification.update({
        where: { id: notificationId },
        data: { emailSent: false },
      });

      return { success: true, logged: true, queued: true };
    }

    const mailOptions = {
      from: FROM_EMAIL,
      to: to || notification.recipientEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    };

    const info = await transporter.sendMail(mailOptions);

    await prisma.orderNotification.update({
      where: { id: notificationId },
      data: { emailSent: true, sentAt: new Date() },
    });

    return { success: true, info, queued: true };
  });
};

module.exports = { queueNotification, sendOrderNotification, createTransporter };