// src/controllers/authController.js

const userService = require('../services/userService');
const knex = require('../config/knex');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sendSuccess, sendCreated } = require('../utils/response');
const {
  ConflictError,
  AuthenticationError,
  NotFoundError,
  BadRequestError,
} = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const oauthCallback = async (req, res, next) => {
  try {
    const user = req.user; // from passport
    
    // Determine the frontend URL intelligently based on the request host
    let frontendUrl = process.env.FRONTEND_URL || '';
    const host = req.get('host') || '';
    if (!frontendUrl) {
      if (host.includes('vercel.app')) {
        frontendUrl = ''; // Use relative redirect on Vercel
      } else {
        frontendUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
      }
    }

    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshTokenString = generateRefreshToken({ id: user.id });

    res.cookie('accessToken', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshTokenString, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend callback route with token in query params
    res.redirect(`${frontendUrl}/oauth-callback?token=${token}&refreshToken=${refreshTokenString}`);
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(MESSAGES.AUTH_EMAIL_EXISTS);
    }

    const hashedPassword = await hashPassword(password);

    // Use Knex transaction
    const user = await knex.transaction(async (trx) => {
      // Fetch dynamic welcome points from settings
      const welcomeSetting = await trx('store_settings')
        .where('settingKey', 'welcome_bonus_points')
        .first();
      const welcomeBonus =
        welcomeSetting && !isNaN(Number(welcomeSetting.settingValue))
          ? Number(welcomeSetting.settingValue)
          : 10;

      const createdUser = await userService.create({
        email,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        rewardPoints: welcomeBonus,
      });

      const cuid = require('cuid');
      const now = new Date();
      await trx('customerProfile').insert({
        id: cuid(),
        userId: createdUser.id,
        createdAt: now,
        updatedAt: now,
      });
      await trx('customerMetrics').insert({
        id: cuid(),
        userId: createdUser.id,
        createdAt: now,
        updatedAt: now,
      });
      await trx('shoppingCart').insert({
        id: cuid(),
        userId: createdUser.id,
        createdAt: now,
        updatedAt: now,
      });

      return createdUser;
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('accessToken', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return sendCreated(res, { user, token, refreshToken }, MESSAGES.AUTH_REGISTER_SUCCESS);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userService.findByEmail(email);

    if (!user) {
      throw new AuthenticationError(MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new AuthenticationError(MESSAGES.AUTH_ACCOUNT_DISABLED);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError(MESSAGES.AUTH_INVALID_CREDENTIALS);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.cookie('accessToken', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password: unusedPassword, ...userWithoutPassword } = user;

    return sendSuccess(
      res,
      { user: userWithoutPassword, token, refreshToken },
      MESSAGES.AUTH_LOGIN_SUCCESS
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken', { ...cookieOptions });
    res.clearCookie('refreshToken', { ...cookieOptions });
    return sendSuccess(res, null, MESSAGES.AUTH_LOGOUT_SUCCESS);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      throw new AuthenticationError('Refresh token is required');
    }

    const decoded = verifyToken(token);

    const user = await userService.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or account disabled');
    }

    const newToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    res.cookie('accessToken', newToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return sendSuccess(
      res,
      { token: newToken, refreshToken: newRefreshToken },
      'Token refreshed successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get customerProfile data (address info)
    const profile = await knex('customerProfile').where('userId', req.user.id).first();

    // Get customerMetrics data (loyalty, tier, spend)
    const metrics = await knex('customerMetrics').where('userId', req.user.id).first();

    const fullProfile = {
      ...user,
      address: profile?.address || null,
      city: profile?.city || null,
      postalCode: profile?.postalCode || null,
      province: profile?.province || null,
      emailPromo: profile?.emailPromo ?? true,
      emailOrderUpdates: profile?.emailOrderUpdates ?? true,

      // Metrics
      currentTier: metrics?.currentTier || 'BRONZE',
      totalSpent: metrics?.totalSpent || 0,
      totalTransactions: metrics?.totalTransactions || 0,
    };

    return sendSuccess(res, fullProfile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new BadRequestError('Email is required');

    const user = await userService.findByEmail(email);
    if (!user) {
      // Don't leak that user doesn't exist, just return success
      return sendSuccess(res, null, 'Jika email terdaftar, tautan reset telah dikirim.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await knex('user').where('id', user.id).update({
      resetPasswordToken: resetToken,
      resetPasswordExpires,
    });

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName);
    } catch (emailErr) {
      // Rollback token if email fails
      await knex('user').where('id', user.id).update({
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      throw emailErr;
    }

    return sendSuccess(res, null, 'Tautan reset password telah dikirim ke email Anda.');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      throw new BadRequestError('Token dan password baru diperlukan');
    }

    const user = await knex('user')
      .where('resetPasswordToken', token)
      .andWhere('resetPasswordExpires', '>', new Date())
      .first();

    if (!user) {
      throw new BadRequestError('Token reset password tidak valid atau sudah kadaluarsa');
    }

    const hashedPassword = await hashPassword(newPassword);

    await knex('user').where('id', user.id).update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: new Date(),
    });

    return sendSuccess(res, null, 'Password berhasil diubah. Silakan login dengan password baru.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  oauthCallback,
  forgotPassword,
  resetPassword,
};
