// src/controllers/authController.js

const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sendSuccess, sendCreated } = require('../utils/response');
const { ConflictError, AuthenticationError, NotFoundError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError(MESSAGES.AUTH_EMAIL_EXISTS);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone: phone || null,
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.customerProfile.create({
        data: { userId: createdUser.id },
      });

      await tx.customerMetrics.create({
        data: { userId: createdUser.id },
      });

      await tx.shoppingCart.create({
        data: { userId: createdUser.id },
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

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        password: true,
      },
    });

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

    return sendSuccess(res, { user: userWithoutPassword, token, refreshToken }, MESSAGES.AUTH_LOGIN_SUCCESS);
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or account disabled');
    }

    const newToken = generateToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    res.cookie('accessToken', newToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return sendSuccess(res, { token: newToken, refreshToken: newRefreshToken }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        customerProfile: true,
        designStaffInfo: true,
      },
    });

    return sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, refreshToken, getMe };
