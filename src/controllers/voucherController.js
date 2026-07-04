const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const cuid = require('cuid');

// Admin: Get all vouchers
const getAllVouchers = async (req, res, next) => {
  try {
    const vouchers = await knex('voucher').orderBy('createdAt', 'desc');
    return sendSuccess(res, vouchers, 'Vouchers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Public: Get active vouchers for checkout
const getActiveVouchers = async (req, res, next) => {
  try {
    const now = new Date();
    const vouchers = await knex('voucher')
      .where('isActive', true)
      .andWhere('isPublic', true)
      .andWhere(function() {
        this.whereNull('expiresAt').orWhere('expiresAt', '>', now);
      })
      .orderBy('createdAt', 'desc');
    
    // Filter out fully used vouchers
    const available = vouchers.filter(v => v.usageLimit === null || v.usedCount < v.usageLimit);
    
    return sendSuccess(res, available, 'Active vouchers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Admin: Create voucher
const createVoucher = async (req, res, next) => {
  try {
    const { code, type, value, minPurchase, maxDiscount, usageLimit, isActive, expiresAt, targetTier, isPublic } = req.body;
    
    if (!code || !type || value === undefined) {
      throw new BadRequestError('Code, type, and value are required');
    }

    const existing = await knex('voucher').where('code', code.toUpperCase()).first();
    if (existing) {
      throw new BadRequestError('Voucher code already exists');
    }

    const voucherId = cuid();
    const newVoucher = {
      id: voucherId,
      code: code.toUpperCase(),
      type,
      value,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || null,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      targetTier: targetTier || 'ALL',
      isPublic: isPublic !== undefined ? isPublic : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await knex('voucher').insert(newVoucher);
    return sendCreated(res, newVoucher, 'Voucher created successfully');
  } catch (error) {
    next(error);
  }
};

// Admin: Update voucher
const updateVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, type, value, minPurchase, maxDiscount, usageLimit, expiresAt, targetTier, isPublic } = req.body;

    const voucher = await knex('voucher').where('id', id).first();
    if (!voucher) throw new NotFoundError('Voucher not found');

    const updateData = {
      updatedAt: new Date()
    };
    
    if (isActive !== undefined) updateData.isActive = isActive;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase || 0;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount || 0;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit || null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (targetTier !== undefined) updateData.targetTier = targetTier;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    await knex('voucher').where('id', id).update(updateData);

    const updated = await knex('voucher').where('id', id).first();
    return sendSuccess(res, updated, 'Voucher updated successfully');
  } catch (error) {
    next(error);
  }
};

// Admin: Delete voucher
const deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await knex('voucher').where('id', id).delete();
    if (!deleted) throw new NotFoundError('Voucher not found');
    return sendSuccess(res, null, 'Voucher deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Public: Validate voucher for checkout
const validateVoucher = async (req, res, next) => {
  try {
    const { code, subtotal, userId } = req.body;
    
    if (!code || subtotal === undefined) {
      throw new BadRequestError('Code and subtotal are required');
    }

    const voucher = await knex('voucher').where('code', code.toUpperCase()).first();
    
    if (!voucher) {
      throw new BadRequestError('Kode voucher tidak ditemukan');
    }
    
    if (!voucher.isActive) {
      throw new BadRequestError('Kode voucher sudah tidak aktif');
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      throw new BadRequestError('Kode voucher sudah kedaluwarsa');
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestError('Kuota voucher sudah habis');
    }

    if (subtotal < voucher.minPurchase) {
      throw new BadRequestError(`Minimal belanja Rp ${Number(voucher.minPurchase).toLocaleString('id-ID')} untuk menggunakan voucher ini`);
    }

    if (voucher.targetTier && voucher.targetTier !== 'ALL') {
      if (!userId) {
        throw new BadRequestError(`Voucher eksklusif ini hanya untuk pelanggan tier ${voucher.targetTier}`);
      }
      const user = await knex('user').where('id', userId).first();
      if (!user || user.currentTier !== voucher.targetTier) {
        throw new BadRequestError(`Voucher eksklusif ini hanya berlaku untuk kustomer tingkat ${voucher.targetTier}`);
      }
    }

    // Hitung diskon
    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountAmount = Math.floor(subtotal * (voucher.value / 100));
      if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
        discountAmount = Number(voucher.maxDiscount);
      }
    } else {
      discountAmount = Number(voucher.value);
    }

    // Make sure discount is not more than subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return sendSuccess(res, {
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      discountAmount
    }, 'Voucher berhasil digunakan');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVouchers,
  getActiveVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher
};
