// src/controllers/authController.js

const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const { ConflictError, AuthenticationError, NotFoundError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError(MESSAGES.AUTH_EMAIL_EXISTS);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
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

    await prisma.customerProfile.create({
      data: { userId: user.id },
    });

    await prisma.customerMetrics.create({
      data: { userId: user.id },
    });

    await prisma.shoppingCart.create({
      data: { userId: user.id },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return sendCreated(res, { user, token }, MESSAGES.AUTH_REGISTER_SUCCESS);
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

    const { password: unusedPassword, ...userWithoutPassword } = user;

    return sendSuccess(res, { user: userWithoutPassword, token, refreshToken }, MESSAGES.AUTH_LOGIN_SUCCESS);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, null, MESSAGES.AUTH_LOGOUT_SUCCESS);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

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
