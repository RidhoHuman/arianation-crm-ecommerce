// src/controllers/userController.js

const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { role, search, isActive } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return sendPaginated(res, users, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, MESSAGES.USERS_FOUND);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
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

    const existing = await prisma.user.findUnique({ where: { id } });
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

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, user, MESSAGES.USER_UPDATED);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return sendSuccess(res, null, MESSAGES.USER_DELETED);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address, city, postalCode, province } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });

    if (address !== undefined || city !== undefined || postalCode !== undefined || province !== undefined) {
      const profileData = {};
      if (address !== undefined) profileData.address = address;
      if (city !== undefined) profileData.city = city;
      if (postalCode !== undefined) profileData.postalCode = postalCode;
      if (province !== undefined) profileData.province = province;

      await prisma.customerProfile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isValid = await comparePassword(currentPassword, user.password);

    if (!isValid) {
      throw new BadRequestError(MESSAGES.USER_WRONG_PASSWORD);
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return sendSuccess(res, null, MESSAGES.USER_PASSWORD_CHANGED);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updateProfile, changePassword };
