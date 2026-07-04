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
