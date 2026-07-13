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
        'variantId',
        'quantity',
        'unitPrice',
        'subtotal',
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
        'variantId',
        'quantity',
        'unitPrice',
        'subtotal',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    return item || null;
  },

  // Cari cart item berdasarkan cartId, productId, dan variantId
  async findByCartProductAndVariant(cartId, productId, variantId = null) {
    let query = knex('cartItem')
      .where('cartId', cartId)
      .where('productId', productId);
      
    if (variantId) {
      query = query.where('variantId', variantId);
    } else {
      query = query.whereNull('variantId');
    }

    const item = await query.first();
    return item || null;
  },

  // Tambah item ke cart atau update quantity jika sudah ada
  async addOrUpdate({ cartId, productId, variantId, quantity, price }) {
    const existing = await this.findByCartProductAndVariant(cartId, productId, variantId);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      return this.update(existing.id, { 
        quantity: newQuantity,
        subtotal: newQuantity * existing.unitPrice
      });
    }

    const id = require('cuid')();

    const item = {
      id,
      cartId,
      productId,
      variantId: variantId || null,
      quantity,
      unitPrice: price,
      subtotal: price * quantity,
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
    const item = await this.findById(id);
    if (!item) return null;

    await knex('cartItem')
      .where('id', id)
      .update({
        quantity,
        subtotal: quantity * item.unitPrice,
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
      .sum('subtotal as total')
      .first();

    return result.total || 0;
  },
};

module.exports = cartItemService;
