// src/services/cartItemService.js
const knex = require('../config/knex');

const cartItemService = {
  // Ambil semua item di shopping cart
  async findMany({ cartId, page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('cartItem');

    if (cartId) {
      query = query.where('cartId', cartId);
    }

    const items = await query
      .select(
        'id',
        'cartId',
        'productId',
        'quantity',
        'price',
        'createdAt',
        'updatedAt'
      )
      .limit(limit)
      .offset(skip);

    return items;
  },

  // Hitung total item di cart
  async count({ cartId } = {}) {
    let query = knex('cartItem');

    if (cartId) {
      query = query.where('cartId', cartId);
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari cart item berdasarkan ID
  async findById(id) {
    const item = await knex('cartItem')
      .select(
        'id',
        'cartId',
        'productId',
        'quantity',
        'price',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    return item || null;
  },

  // Cari cart item berdasarkan cartId dan productId
  async findByCartAndProduct(cartId, productId) {
    const item = await knex('cartItem')
      .where('cartId', cartId)
      .where('productId', productId)
      .first();

    return item || null;
  },

  // Tambah item ke cart atau update quantity jika sudah ada
  async addOrUpdate({ cartId, productId, quantity, price }) {
    const existing = await this.findByCartAndProduct(cartId, productId);

    if (existing) {
      return this.update(existing.id, { quantity: existing.quantity + quantity });
    }

    const id = require('cuid')();

    const item = {
      id,
      cartId,
      productId,
      quantity,
      price,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('cartItem').insert(item);

    return item;
  },

  // Update cart item
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('cartItem')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Update quantity
  async updateQuantity(id, quantity) {
    await knex('cartItem')
      .where('id', id)
      .update({
        quantity,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Hapus cart item
  async delete(id) {
    await knex('cartItem')
      .where('id', id)
      .delete();

    return true;
  },

  // Hapus semua item dari cart
  async deleteAll(cartId) {
    await knex('cartItem')
      .where('cartId', cartId)
      .delete();

    return true;
  },

  // Ambil total harga cart
  async getCartTotal(cartId) {
    const result = await knex('cartItem')
      .where('cartId', cartId)
      .sum('price as total')
      .first();

    return result.total || 0;
  },
};

module.exports = cartItemService;
