const knex = require('../config/knex');
const nodemailer = require('nodemailer');
const { enqueueNotification } = require('./notificationQueue');
const { renderOrderNotificationEmail } = require('./emailTemplates');
const webPush = require('web-push');

const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@arianation.local';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${FROM_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}


function createTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    // Return null transporter to fallback to console logging
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Queue a notification record in DB
 * @param {Object} params { orderId, userId, recipientEmail, type, title, message }
 * @returns {Promise<Object>} created notification
 */
const queueNotification = async ({
  orderId,
  userId = null,
  recipientEmail = null,
  type,
  title,
  message,
}) => {
  if (!orderId) {
    throw new Error('orderId is required to queue a notification');
  }

  const order = await knex('order')
    .select('id', 'orderNumber', 'userId')
    .where('id', orderId)
    .first();

  if (!order) {
    throw new Error(`Order not found for orderId: ${orderId}`);
  }

  const customer = await knex('user')
    .select('id', 'email', 'fullName')
    .where('id', userId || order.userId)
    .first();

  const cuid = require('cuid');
  const notificationId = cuid();
  
  await knex('customerNotification').insert({
    id: notificationId,
    userId: userId || order.userId || null,
    recipientEmail: recipientEmail || customer?.email || null,
    referenceId: orderId,
    referenceType: 'ORDER',
    type,
    title,
    message,
    emailSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const returnData = {
    id: notificationId,
    referenceId: orderId,
    referenceType: 'ORDER',
    userId: userId || order.userId || null,
    recipientEmail: recipientEmail || customer?.email || null,
    type,
    title,
    message,
    emailSent: false,
  };

  // Attempt to send web push
  try {
    const targetUserId = userId || order.userId;
    if (targetUserId && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const subscriptions = await knex('pushSubscriptions').where({ userId: targetUserId });
      
      const pushPayload = JSON.stringify({
        title: title || 'Notifikasi Baru',
        body: message,
        url: `/customer/orders/${orderId}`,
        icon: '/images/arianation-logo.png' // Or appropriate icon
      });

      for (const sub of subscriptions) {
        try {
          await webPush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, pushPayload);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription has expired or is no longer valid
            await knex('pushSubscriptions').where({ id: sub.id }).delete();
          } else {
            console.error('Error sending push notification to a subscription:', err);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to send web push notification:', error);
  }

  return returnData;
};

/**
 * Queue a polymorphic customer notification
 * @param {Object} params { referenceId, referenceType, userId, recipientEmail, type, title, message }
 * @returns {Promise<Object>} created notification
 */
const queueCustomerNotification = async ({
  referenceId = null,
  referenceType = 'SYSTEM',
  userId,
  recipientEmail = null,
  type,
  title,
  message,
}) => {
  if (!userId && !recipientEmail) {
    throw new Error('userId or recipientEmail is required to queue a customer notification');
  }

  const customer = userId ? await knex('user')
    .select('id', 'email', 'fullName')
    .where('id', userId)
    .first() : null;

  const cuid = require('cuid');
  const notificationId = cuid();
  
  await knex('customerNotification').insert({
    id: notificationId,
    userId: userId || null,
    recipientEmail: recipientEmail || customer?.email || null,
    referenceId,
    referenceType,
    type,
    title,
    message,
    emailSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const returnData = {
    id: notificationId,
    referenceId,
    referenceType,
    userId: userId || null,
    recipientEmail: recipientEmail || customer?.email || null,
    type,
    title,
    message,
    emailSent: false,
  };

  // Attempt to send web push
  try {
    if (userId && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const subscriptions = await knex('pushSubscriptions').where({ userId });
      
      const urlMap = {
        'ORDER': `/customer/orders/${referenceId}`,
        'DESIGN_REQUEST': `/account?tab=sablon`,
        'SYSTEM': `/notifications`
      };
      
      const pushPayload = JSON.stringify({
        title: title || 'Notifikasi Baru',
        body: message,
        url: urlMap[referenceType] || `/notifications`,
        icon: '/images/arianation-logo.png'
      });

      for (const sub of subscriptions) {
        try {
          await webPush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, pushPayload);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await knex('pushSubscriptions').where({ id: sub.id }).delete();
          } else {
            console.error('Error sending push notification to a subscription:', err);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to send web push notification:', error);
  }

  return returnData;
};

/**
 * Send notification email by notification id
 * If SMTP not configured, log to console and mark as sent
 */
const sendOrderNotification = async (notificationId) => {
  return enqueueNotification(async () => {
    const notification = await knex('customerNotification')
      .select('id', 'referenceId', 'referenceType', 'userId', 'recipientEmail', 'type', 'title', 'message', 'emailSent')
      .where('id', notificationId)
      .first();

    if (!notification) throw new Error('Notification not found');

    const order = notification.referenceType === 'ORDER' 
      ? await knex('order')
        .select('id', 'orderNumber', 'totalAmount', 'status', 'createdAt', 'deliveryType')
        .where('id', notification.referenceId)
        .first()
      : null;

    const transporter = createTransporter();

    const customer = notification.userId
      ? await knex('user')
          .select('id', 'email', 'fullName')
          .where('id', notification.userId)
          .first()
      : null;

    const to = notification.recipientEmail || customer?.email || null;
    const email = renderOrderNotificationEmail({
      notification,
      customer,
      order,
    });

    if (!transporter) {
      // Fallback: log
      console.log('==== Notification (no SMTP configured) ====');
      console.log('To:', to || '(no recipient)');
      console.log('Subject:', email.subject);
      console.log('Text:', email.text);

      await knex('customerNotification')
        .where('id', notificationId)
        .update({
          emailSent: false,
          updatedAt: new Date(),
        });

      return { success: true, logged: true, queued: true };
    }

    const mailOptions = {
      from: `"${process.env.STORE_NAME || 'Arianation E-Commerce'}" <${process.env.EMAIL_USER || process.env.SMTP_USER || FROM_EMAIL}>`,
      to: to || notification.recipientEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    };

    const info = await transporter.sendMail(mailOptions);

    await knex('customerNotification')
      .where('id', notificationId)
      .update({
        emailSent: true,
        sentAt: new Date(),
        updatedAt: new Date(),
      });

    return { success: true, info, queued: true };
  });
};

module.exports = { queueNotification, queueCustomerNotification, sendOrderNotification, createTransporter };
