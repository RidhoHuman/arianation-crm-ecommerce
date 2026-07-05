const knex = require('../config/knex');
const cuid = require('cuid');

class ActivityService {
  /**
   * Log a new system activity
   * @param {Object} data 
   * @param {string} data.userId - Optional ID of the user performing the action
   * @param {string} data.action - Brief description of action (e.g., 'Update Stock')
   * @param {string} data.details - Detailed context (e.g., 'Restocked Basic T-Shirt by 50')
   * @param {string} data.entityType - 'PRODUCT', 'ORDER', 'USER', etc.
   * @param {string} data.entityId - ID of the entity affected
   */
  async logActivity({ userId, action, details, entityType, entityId }) {
    try {
      await knex('system_activity').insert({
        id: cuid(),
        userId: userId || null,
        action,
        details: details || null,
        entityType: entityType || null,
        entityId: entityId || null,
        createdAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('[System Activity Log Error]:', error);
      // We don't throw error to prevent blocking main business logic
      return false;
    }
  }

  /**
   * Fetch recent activities for dashboard
   * @param {number} limit 
   */
  async getRecentActivities(limit = 10) {
    try {
      const activities = await knex('system_activity')
        .select('system_activity.*', 'user.fullName as userName', 'user.email as userEmail')
        .leftJoin('user', 'system_activity.userId', 'user.id')
        .orderBy('system_activity.createdAt', 'desc')
        .limit(limit);

      return activities;
    } catch (error) {
      console.error('[Fetch Activities Error]:', error);
      throw error;
    }
  }
}

module.exports = new ActivityService();
