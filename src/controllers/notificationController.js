const knex = require('../config/knex');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await knex('admin_notifications')
      .orderBy('createdAt', 'desc')
      .limit(50); // Get latest 50 notifications
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const result = await knex('admin_notifications')
      .where({ isRead: false })
      .count('id as count')
      .first();
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ success: false, message: 'Gagal menghitung notifikasi' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await knex('admin_notifications').where({ id }).update({ isRead: true });
    res.json({ success: true, message: 'Notifikasi ditandai dibaca' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Gagal menandai notifikasi' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await knex('admin_notifications').where({ isRead: false }).update({ isRead: true });
    res.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Gagal menandai semua notifikasi' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await knex('admin_notifications').where({ id }).delete();
    res.json({ success: true, message: 'Notifikasi dihapus' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus notifikasi' });
  }
};

/**
 * CUSTOMER NOTIFICATIONS
 */

exports.getCustomerNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const notifications = await knex('customerNotification')
      .where('userId', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const totalResult = await knex('customerNotification')
      .where('userId', userId)
      .count('id as count')
      .first();
      
    const total = totalResult.count;
    
    // Fallback unread count if isRead column doesn't exist
    let unreadCount = 0;
    try {
      const unreadResult = await knex('customerNotification')
        .where('userId', userId)
        .andWhere('isRead', false)
        .count('id as count')
        .first();
      unreadCount = unreadResult.count;
    } catch (e) {
      // Ignored if column missing
    }

    res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching customer notifications:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.markCustomerAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      await knex('customerNotification')
        .where('id', id)
        .andWhere('userId', userId)
        .update({
          isRead: true
        });
    } catch (e) {
      console.error('Error during markCustomerAsRead query:', e);
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking customer notification as read:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.markAllCustomerAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    try {
      await knex('customerNotification')
        .where('userId', userId)
        .andWhere('isRead', false)
        .update({
          isRead: true
        });
    } catch (e) {
      console.error('Error during markAllCustomerAsRead query:', e);
    }

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all customer notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * WEB PUSH NOTIFICATIONS
 */

exports.getVapidPublicKey = (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
};

exports.subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    // Check if subscription already exists for this endpoint
    const existing = await knex('pushSubscriptions').where({ endpoint: subscription.endpoint }).first();

    if (existing) {
      // Update userId if it belongs to someone else (or same)
      if (existing.userId !== userId) {
        await knex('pushSubscriptions').where({ endpoint: subscription.endpoint }).update({ userId });
      }
      return res.status(200).json({ success: true, message: 'Subscription updated' });
    }

    // Insert new subscription
    await knex('pushSubscriptions').insert({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    });

    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to save subscription' });
  }
};

exports.unsubscribeFromPush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required' });
    }

    await knex('pushSubscriptions').where({ endpoint, userId }).delete();

    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to remove subscription' });
  }
};
