// src/services/productService.js
const knex = require('../config/knex');

const productService = {
  // Ambil semua produk dengan filter dan pagination
  async findMany({ page = 1, limit = 10, category, search, isActive, businessType, productType } = {}) {
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
    
    // Filter berdasarkan businessType
    if (businessType) {
      query = query.where('businessType', businessType);
    }
    
    // Filter berdasarkan productType
    if (productType) {
      query = query.where('productType', productType);
    }

    // Filter berdasarkan search
    if (search) {
      query = query.where((builder) => {
        builder.where('productName', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`);
      });
    }

    const products = await query
      .leftJoin('category', 'product.categoryId', 'category.id')
      .select(
        'product.id',
        'product.categoryId',
        'category.categoryName',
        'product.productName',
        'product.description',
        'product.descriptionEn',
        'product.price',
        'product.stockQuantity',
        'product.productType',
        'product.productTypeId',
        'product.imageUrl',
        'product.businessType',
        'product.isActive',
        'product.tags',
        'product.isSale',
        'product.imageUrls',
        'product.createdAt',
        'product.updatedAt'
      )
      .orderBy('product.createdAt', 'desc')
      .limit(limit)
      .offset(skip);

    return products.map(p => ({
      ...p,
      category: p.categoryName ? { categoryName: p.categoryName } : null
    }));
  },

  // Hitung total produk dengan filter yang sama
  async count({ category, search, isActive, businessType, productType } = {}) {
    let query = knex('product');

    if (category) {
      query = query.where('categoryId', category);
    }

    if (isActive !== undefined) {
      query = query.where('isActive', isActive === 'true' || isActive === true ? 1 : 0);
    }

    if (businessType) {
      query = query.where('businessType', businessType);
    }

    if (productType) {
      query = query.where('productType', productType);
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
        'descriptionEn',
        'price',
        'stockQuantity',
        'productType',
        'productTypeId',
        'imageUrl',
        'businessType',
        'isActive',
        'tags',
        'isSale',
        'imageUrls',
        'allowedPrintAreas',
        'createdAt',
        'updatedAt'
      )
      .where('id', id)
      .first();

    if (product) {
      const variants = await knex('productVariant').where('productId', id);
      product.variants = variants;
    }

    return product || null;
  },

  // Buat produk baru
  async create({
    categoryId,
    productName,
    description,
    descriptionEn,
    price,
    stockQuantity,
    productType,
    productTypeId = null,
    imageUrl = '',
    businessType,
    isActive = true,
    tags = null,
    isSale = false,
    imageUrls = null,
    allowedPrintAreas = null,
    variants = [],
  }) {
    const id = require('cuid')();

    const product = {
      id,
      categoryId,
      productName,
      description,
      descriptionEn,
      price,
      stockQuantity,
      productType,
      productTypeId,
      imageUrl,
      businessType,
      isActive,
      tags,
      isSale,
      imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
      allowedPrintAreas: allowedPrintAreas ? JSON.stringify(allowedPrintAreas) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex.transaction(async (trx) => {
      await trx('product').insert(product);
      
      if (variants && variants.length > 0) {
        const variantRecords = variants.map(v => ({
          id: require('cuid')(),
          productId: id,
          variantName: v.variantName || '',
          color: v.color || null,
          colorCode: v.colorCode || null,
          imageUrl: v.imageUrl || null,
          imageUrlBack: v.imageUrlBack || null,
          imageUrlLeft: v.imageUrlLeft || null,
          imageUrlRight: v.imageUrlRight || null,
          stockQuantity: parseInt(v.stockQuantity, 10) || 0,
          sku: v.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          additionalPrice: parseFloat(v.additionalPrice) || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await trx('productVariant').insert(variantRecords);
      }
    });

    return product;
  },

  // Update produk
  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    
    if (updateData.imageUrls !== undefined) {
      updateData.imageUrls = updateData.imageUrls ? JSON.stringify(updateData.imageUrls) : null;
    }
    
    if (updateData.allowedPrintAreas !== undefined) {
      updateData.allowedPrintAreas = updateData.allowedPrintAreas ? JSON.stringify(updateData.allowedPrintAreas) : null;
    }

    // Extract variants so it doesn't get updated in the main product table
    const { variants, ...productFields } = updateData;

    await knex.transaction(async (trx) => {
      if (Object.keys(productFields).length > 0) {
        await trx('product')
          .where('id', id)
          .update(productFields);
      }
      
      if (variants !== undefined) {
        // Simple strategy: delete existing and re-insert
        await trx('productVariant').where('productId', id).delete();
        
        if (variants && variants.length > 0) {
          const variantRecords = variants.map(v => ({
            id: require('cuid')(),
            productId: id,
            variantName: v.variantName || '',
            color: v.color || null,
            colorCode: v.colorCode || null,
            imageUrl: v.imageUrl || null,
            imageUrlBack: v.imageUrlBack || null,
            imageUrlLeft: v.imageUrlLeft || null,
            imageUrlRight: v.imageUrlRight || null,
            stockQuantity: parseInt(v.stockQuantity, 10) || 0,
            sku: v.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            additionalPrice: parseFloat(v.additionalPrice) || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          await trx('productVariant').insert(variantRecords);
        }
      }
    });

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
        'imageUrls',
        'businessType',
        'createdAt'
      )
      .limit(limit);

    return products;
  },
};

module.exports = productService;
