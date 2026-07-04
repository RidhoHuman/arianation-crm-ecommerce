// src/services/userService.js
const knex = require('../config/knex');

const userService = {
  // Ambil semua user dengan filter dan pagination
  async findMany({ page = 1, limit = 10, role, search, isActive } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('user');

    // Filter berdasarkan role
    if (role) {
      query = query.where('role', role);
    }

    // Filter berdasarkan isActive
    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Filter berdasarkan search (fullName atau email)
    if (search) {
      query = query.where((builder) => {
        builder.where('fullName', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      });
    }

    const users = await query
      .select('id', 'email', 'fullName', 'phone', 'role', 'isActive', 'rewardPoints', 'createdAt', 'updatedAt')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    return users;
  },

  // Hitung total user dengan filter yang sama
  async count({ role, search, isActive } = {}) {
    let query = knex('user');

    if (role) {
      query = query.where('role', role);
    }

    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' || isActive === true ? 1 : 0);
    }

    if (search) {
      query = query.where((builder) => {
        builder.where('fullName', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`);
      });
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari user berdasarkan ID
  async findById(id) {
    const user = await knex('user')
      .select('id', 'email', 'fullName', 'phone', 'role', 'isActive', 'rewardPoints', 'createdAt', 'updatedAt')
      .where('id', id)
      .first();

    return user || null;
  },

  // Cari user berdasarkan email
  async findByEmail(email) {
    const user = await knex('user')
      .where('email', email)
      .first();

    return user || null;
  },

  // Buat user baru
  async create({ email, password, fullName, phone, role = 'CUSTOMER', isActive = true, rewardPoints = 0 }) {
    const id = require('cuid')();
    
    const user = {
      id,
      email,
      password,
      fullName,
      phone: phone || null,
      role,
      isActive,
      rewardPoints,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('user').insert(user);

    // Return user tanpa password
    delete user.password;
    return user;
  },

  // Update user
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('user')
      .where('id', id)
      .update(updateData);

    // Return updated user
    return this.findById(id);
  },

  // Hapus user
  async delete(id) {
    await knex('user')
      .where('id', id)
      .delete();

    return true;
  },

  // Update password user
  async updatePassword(id, hashedPassword) {
    await knex('user')
      .where('id', id)
      .update({
        password: hashedPassword,
        updatedAt: new Date(),
      });

    return true;
  },

  // Verify email
  async verifyEmail(id) {
    await knex('user')
      .where('id', id)
      .update({
        emailVerified: new Date(),
        updatedAt: new Date(),
      });

    return true;
  },

  // Deactivate user
  async deactivate(id) {
    await knex('user')
      .where('id', id)
      .update({
        isActive: false,
        updatedAt: new Date(),
      });

    return true;
  },

  // Activate user
  async activate(id) {
    await knex('user')
      .where('id', id)
      .update({
        isActive: true,
        updatedAt: new Date(),
      });

    return true;
  },
};

module.exports = userService;
