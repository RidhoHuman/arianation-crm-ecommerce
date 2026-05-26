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
        'totalItems',
        'totalPrice',
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
      totalItems: 0,
      totalPrice: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('shoppingCart').insert(cart);

    return cart;
  },

  // Update cart total items dan harga
  async updateTotals(id, { totalItems, totalPrice }) {
    const updateData = {
      totalItems,
      totalPrice,
      updatedAt: new Date(),
    };

    await knex('shoppingCart')
      .where('id', id)
      .update(updateData);

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
        totalItems: 0,
        totalPrice: 0,
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
