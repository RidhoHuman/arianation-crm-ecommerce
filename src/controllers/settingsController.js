// src/controllers/settingsController.js
const knex = require('../config/knex');
const { sendSuccess, sendError } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const settings = await knex('store_settings').select('settingKey', 'settingValue');
    // Convert array of {settingKey, settingValue} to object { key: value }
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.settingKey] = s.settingValue;
    });

    // Fallback if not found
    if (!settingsObj.best_seller_threshold) {
      settingsObj.best_seller_threshold = '5';
    }
    if (!settingsObj.welcome_bonus_points) {
      settingsObj.welcome_bonus_points = '10';
    }
    if (!settingsObj.points_earning_rate) {
      settingsObj.points_earning_rate = '10000';
    }
    if (!settingsObj.review_text_points) {
      settingsObj.review_text_points = '100';
    }
    if (!settingsObj.review_image_points) {
      settingsObj.review_image_points = '500';
    }
    if (!settingsObj.points_exchange_rate) {
      settingsObj.points_exchange_rate = '10';
    }
    if (!settingsObj.max_points_discount_percentage) {
      settingsObj.max_points_discount_percentage = '50';
    }

    sendSuccess(res, settingsObj, 'Berhasil mengambil pengaturan toko');
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settingsUpdates = req.body; // e.g. { best_seller_threshold: "10" }

    // Update or insert each setting
    for (const [key, value] of Object.entries(settingsUpdates)) {
      const existing = await knex('store_settings').where('settingKey', key).first();
      if (existing) {
        await knex('store_settings')
          .where('settingKey', key)
          .update({ settingValue: String(value) });
      } else {
        await knex('store_settings').insert({ settingKey: key, settingValue: String(value) });
      }
    }

    sendSuccess(res, null, 'Pengaturan berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
