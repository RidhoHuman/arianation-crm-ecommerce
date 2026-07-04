// src/controllers/userController.js

const userService = require('../services/userService');
const knex = require('../config/knex');
const { hashPassword, comparePassword } = require('../utils/password');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { role, search, isActive } = req.query;

    const [users, total] = await Promise.all([
      userService.findMany({ page, limit, role, search, isActive }),
      userService.count({ role, search, isActive }),
    ]);

    return sendPaginated(
      res,
      users,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.USERS_FOUND
    );
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await userService.findById(id);

    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    // Inject Customer Metrics
    const metrics = await knex('customerMetrics').where('userId', id).first();
    if (metrics) {
      user.metrics = metrics;
    } else {
      user.metrics = {
        currentTier: 'BRONZE',
        totalSpent: 0,
        loyaltyPoints: user.rewardPoints || 0,
        totalTransactions: 0
      };
    }

    return sendSuccess(res, user, MESSAGES.USER_FOUND);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, isActive, role } = req.body;

    if (req.user.role === 'CUSTOMER' && req.user.id !== id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const existing = await userService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;

    if (['ADMIN', 'OWNER'].includes(req.user.role)) {
      if (isActive !== undefined) updateData.isActive = isActive;
      if (role !== undefined) updateData.role = role;
    }

    const user = await userService.update(id, updateData);

    return sendSuccess(res, user, MESSAGES.USER_UPDATED);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await userService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    await userService.deactivate(id);

    return sendSuccess(res, null, MESSAGES.USER_DELETED);
  } catch (error) {
    next(error);
  }
};

  const updateProfile = async (req, res, next) => {
    try {
      const {
        fullName,
        phone,
        address,
        city,
        postalCode,
        province,
        emailPromo,
        emailOrderUpdates,
      } = req.body;
      const userId = req.user.id;
  
      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
  
      const user = await userService.update(userId, updateData);
  
      if (
        address !== undefined ||
        city !== undefined ||
        postalCode !== undefined ||
        province !== undefined ||
        emailPromo !== undefined ||
        emailOrderUpdates !== undefined
      ) {
        const profileData = {};
        if (address !== undefined) profileData.address = address;
        if (city !== undefined) profileData.city = city;
        if (postalCode !== undefined) profileData.postalCode = postalCode;
        if (province !== undefined) profileData.province = province;
        if (emailPromo !== undefined) profileData.emailPromo = emailPromo;
        if (emailOrderUpdates !== undefined) profileData.emailOrderUpdates = emailOrderUpdates;

      // Insert/Update ke customerProfile table menggunakan Knex
      const existing = await knex('customerProfile').where('userId', userId).first();
      if (existing) {
        await knex('customerProfile').where('userId', userId).update({
          ...profileData,
          updatedAt: new Date()
        });
      } else {
        const id = require('cuid')();
        await knex('customerProfile').insert({
          id,
          userId,
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return sendSuccess(res, user, MESSAGES.USER_UPDATED);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters');
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    // Get password hash dari database
    const userWithPassword = await knex('user').where('id', userId).first();
    const isValid = await comparePassword(currentPassword, userWithPassword.password);

    if (!isValid) {
      throw new BadRequestError(MESSAGES.USER_WRONG_PASSWORD);
    }

    const hashed = await hashPassword(newPassword);
    await userService.updatePassword(userId, hashed);

    return sendSuccess(res, null, MESSAGES.USER_PASSWORD_CHANGED);
  } catch (error) {
    next(error);
  }
};

const getPointsHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const history = await knex('pointHistory')
      .where('userId', userId)
      .orderBy('createdAt', 'desc');

    // Jika kosong, kita berikan bonus registrasi fiktif (karena user lama belum tercatat saat register)
    if (history.length === 0) {
      const user = await userService.findById(userId);
      if (user && user.rewardPoints > 0) {
        history.push({
          id: 'bonus-reg',
          userId,
          points: user.rewardPoints,
          type: 'EARNED',
          description: 'Bonus Registrasi Akun',
          createdAt: user.createdAt,
        });
      }
    }

    return sendSuccess(res, history, 'Points history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getPointsHistory,
};
