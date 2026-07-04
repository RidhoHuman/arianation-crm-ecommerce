// src/services/cartService.js
const knex = require('../config/knex');

const cartService = {
  // Cari shopping cart berdasarkan user ID
  async findByUserId(userId) {
    const cart = await knex('shoppingCart')
      .where('userId', userId)
      .first();

    return cart || null;
  },

  // Cari shopping cart berdasarkan ID
  async findById(id) {
    const cart = await knex('shoppingCart')
      .select(
        'id',
        'userId',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    return cart || null;
  },

  // Buat shopping cart baru
  async create({ userId }) {
    const id = require('cuid')();

    const cart = {
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('shoppingCart').insert(cart);

    return cart;
  },

  // Update cart
  async updateTotals(id, { totalItems, totalPrice }) {
    // Legacy function, shoppingCart no longer stores totals directly
    return this.findById(id);
  },

  // Update cart
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('shoppingCart')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Clear cart
  async clear(id) {
    await knex('shoppingCart')
      .where('id', id)
      .update({
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Hapus shopping cart
  async delete(id) {
    await knex('shoppingCart')
      .where('id', id)
      .delete();

    return true;
  },

  // Get or create cart untuk user
  async getOrCreateCart(userId) {
    let cart = await this.findByUserId(userId);

    if (!cart) {
      cart = await this.create({ userId });
    }

    return cart;
  },
};

module.exports = cartService;
