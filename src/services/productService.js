// src/services/productService.js
const knex = require('../config/knex');

const productService = {
  // Ambil semua produk dengan filter dan pagination
  async findMany({ page = 1, limit = 10, category, search, isActive } = {}) {
    const skip = (page - 1) * limit;
    let query = knex('product');

    // Filter berdasarkan kategori
    if (category) {
      query = query.where('categoryId', category);
    }

    // Filter berdasarkan status
    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' || isActive === true ? 1 : 0);
    }

    // Filter berdasarkan search
    if (search) {
      query = query.where((builder) => {
        builder.where('productName', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`);
      });
    }

    const products = await query
      .select(
        'id',
        'categoryId',
        'productName',
        'description',
        'price',
        'stockQuantity',
        'productType',
        'imageUrl',
        'businessType',
        'isActive',
        'createdAt',
        'updatedAt'
      )
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    return products;
  },

  // Hitung total produk dengan filter yang sama
  async count({ category, search, isActive } = {}) {
    let query = knex('product');

    if (category) {
      query = query.where('categoryId', category);
    }

    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' || isActive === true ? 1 : 0);
    }

    if (search) {
      query = query.where((builder) => {
        builder.where('productName', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`);
      });
    }

    const result = await query.count('* as count').first();
    return result.count;
  },

  // Cari produk berdasarkan ID
  async findById(id) {
    const product = await knex('product')
      .select(
        'id',
        'categoryId',
        'productName',
        'description',
        'price',
        'stockQuantity',
        'productType',
        'imageUrl',
        'businessType',
        'isActive',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    return product || null;
  },

  // Buat produk baru
  async create({
    categoryId,
    productName,
    description,
    price,
    stockQuantity,
    productType,
    imageUrl = '',
    businessType,
    isActive = true,
  }) {
    const id = require('cuid')();

    const product = {
      id,
      categoryId,
      productName,
      description,
      price,
      stockQuantity,
      productType,
      imageUrl,
      businessType,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('product').insert(product);

    return product;
  },

  // Update produk
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await knex('product')
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  },

  // Hapus produk
  async delete(id) {
    await knex('product')
      .where('id', id)
      .delete();

    return true;
  },

  // Update stok produk
  async updateStock(id, quantity) {
    await knex('product')
      .where('id', id)
      .update({
        stockQuantity: quantity,
        updatedAt: new Date(),
      });

    return this.findById(id);
  },

  // Deactivate produk
  async deactivate(id) {
    await knex('product')
      .where('id', id)
      .update({
        isActive: false,
        updatedAt: new Date(),
      });

    return true;
  },

  // Activate produk
  async activate(id) {
    await knex('product')
      .where('id', id)
      .update({
        isActive: true,
        updatedAt: new Date(),
      });

    return true;
  },

  // Ambil produk berdasarkan kategori
  async findByCategory(categoryId, limit = 10) {
    const products = await knex('product')
      .where('categoryId', categoryId)
      .where('isActive', true)
      .select(
        'id',
        'categoryId',
        'productName',
        'description',
        'price',
        'stockQuantity',
        'productType',
        'imageUrl',
        'businessType',
        'createdAt'
      )
      .limit(limit);

    return products;
  },
};

module.exports = productService;
