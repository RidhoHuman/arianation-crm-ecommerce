// src/controllers/settingsController.js
const knex = require('../config/knex');
const { sendSuccess, sendError } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const settings = await knex('store_settings').select('settingKey', 'settingValue');
    // Convert array of {settingKey, settingValue} to object { key: value }
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.settingKey] = s.settingValue;
    });
    
    // Fallback if not found
    if (!settingsObj.best_seller_threshold) {
      settingsObj.best_seller_threshold = '5';
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
        await knex('store_settings').where('settingKey', key).update({ settingValue: String(value) });
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
  updateSettings
};
