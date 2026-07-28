// src/controllers/staffController.js

const userService = require('../services/userService');
const { hashPassword } = require('../utils/password');
const { sendSuccess, sendCreated } = require('../utils/response');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');
const knex = require('../config/knex');

const staffController = {
  // Get all admins
  async getAllAdmins(req, res, next) {
    try {
      const admins = await userService.findMany({ role: 'ADMIN', limit: 100 });
      return sendSuccess(res, admins, 'Admins retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Create a new admin
  async createAdmin(req, res, next) {
    try {
      const { email, password, fullName, phone } = req.body;

      if (!email || !password || !fullName) {
        throw new BadRequestError('Email, password, and fullName are required');
      }

      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already exists');
      }

      const hashedPassword = await hashPassword(password);

      const admin = await knex.transaction(async (trx) => {
        const createdAdmin = await userService.create({
          email,
          password: hashedPassword,
          fullName,
          phone: phone || null,
          role: 'ADMIN',
        });

        // Admins don't need customer profile/metrics strictly, but to maintain integrity:
        const cuid = require('cuid');
        const now = new Date();
        await trx('customerProfile').insert({
          id: cuid(),
          userId: createdAdmin.id,
          createdAt: now,
          updatedAt: now,
        });
        await trx('customerMetrics').insert({
          id: cuid(),
          userId: createdAdmin.id,
          createdAt: now,
          updatedAt: now,
        });

        return createdAdmin;
      });

      return sendCreated(res, admin, 'Admin created successfully');
    } catch (error) {
      next(error);
    }
  },

  // Reset admin password
  async resetAdminPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        throw new BadRequestError('New password is required');
      }

      const admin = await userService.findById(id);
      if (!admin || admin.role !== 'ADMIN') {
        throw new NotFoundError('Admin not found');
      }

      const hashedPassword = await hashPassword(newPassword);
      await userService.updatePassword(id, hashedPassword);

      return sendSuccess(res, null, 'Admin password reset successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete admin (or deactivate)
  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const admin = await userService.findById(id);
      if (!admin || admin.role !== 'ADMIN') {
        throw new NotFoundError('Admin not found');
      }

      // We use delete from userService to completely remove
      await userService.delete(id);

      return sendSuccess(res, null, 'Admin deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = staffController;
