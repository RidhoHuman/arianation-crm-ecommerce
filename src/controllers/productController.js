// src/controllers/productController.js

const productService = require('../services/productService');
const knex = require('../config/knex');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { categoryId, category, collectionId, collection, businessType, productType, excludeType, isActive, search, minPrice, maxPrice, tag, isSale, type, sortBy, sortOrder } =
      req.query;

    // Build Knex query dengan filter
    let query = knex('product')
      .leftJoin('productCategory', 'product.categoryId', 'productCategory.id');

    if (categoryId) query = query.where('product.categoryId', categoryId);
    if (category) query = query.where('product.categoryId', category);
    
    if (collectionId || collection) {
      const colId = collectionId || collection;
      
      if (colId === 'new-arrivals') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.where(builder => {
          builder.whereExists(function() {
            this.select('*').from('product_collection')
                .where('collectionId', colId)
                .whereRaw('product_collection.productId = product.id');
          }).orWhere('product.createdAt', '>=', thirtyDaysAgo);
        });
      } else if (colId === 'best-seller') {
        // Fetch threshold dynamically
        const setting = await knex('store_settings').where('settingKey', 'best_seller_threshold').first();
        const threshold = setting && !isNaN(parseInt(setting.settingValue, 10)) ? parseInt(setting.settingValue, 10) : 5;
        
        query = query.where(builder => {
          builder.whereExists(function() {
            this.select('*').from('product_collection')
                .where('collectionId', colId)
                .whereRaw('product_collection.productId = product.id');
          }).orWhereExists(function() {
            this.select('productId').from('orderItem')
                .whereRaw('orderItem.productId = product.id')
                .groupBy('productId')
                .havingRaw('SUM(quantity) >= ?', [threshold]);
          });
        });
      } else {
        query = query.join('product_collection', 'product.id', 'product_collection.productId')
                     .where('product_collection.collectionId', colId);
      }
    }
    
    // Map URL type (e.g., 't-shirts', 'hoodies') using product_type_master slug or id
    if (type) {
      query = query.leftJoin('product_type_master', 'product.productTypeId', 'product_type_master.id')
                   .where(function() {
                     this.where('product_type_master.slug', type)
                         .orWhere('product_type_master.id', type);
                   });
    }

    if (businessType) query = query.where('product.businessType', businessType);
    if (productType) query = query.where('product.productType', productType);
    if (excludeType) query = query.whereNot('product.productType', excludeType);
    if (isActive !== undefined) query = query.where('product.isActive', isActive === 'true' ? 1 : 0);
    if (isSale !== undefined) query = query.where('product.isSale', isSale === 'true' ? 1 : 0);
    if (tag) query = query.where('product.tags', 'like', `%${tag}%`);
    if (search) {
      const terms = search.trim().split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        query = query.where((builder) => {
          terms.forEach(term => {
            builder.where(sub => {
              sub.where('product.productName', 'like', `%${term}%`)
                 .orWhere('product.description', 'like', `%${term}%`);
            });
          });
        });
      }
    }
    if (minPrice) query = query.where('product.price', '>=', parseFloat(minPrice));
    if (maxPrice) query = query.where('product.price', '<=', parseFloat(maxPrice));

    let sortColumn = 'createdAt';
    let sortDirection = 'desc';
    if (sortBy === 'stock') sortColumn = 'stockQuantity';
    else if (sortBy === 'price') sortColumn = 'price';
    else if (sortBy === 'name') sortColumn = 'productName';
    
    if (sortOrder === 'asc') sortDirection = 'asc';

    const [products, countResult] = await Promise.all([
      query.clone()
        .select(
          'product.id',
          'product.categoryId',
          'product.productName',
          'product.description',
          'product.price',
          'product.stockQuantity',
          'product.productType',
          'product.imageUrl',
          'product.businessType',
          'product.isActive',
          'product.tags',
          'product.isSale',
          'product.salePrice',
          'product.imageUrls',
          'product.trackStock',
          'product.createdAt',
          'product.updatedAt',
          'productCategory.categoryName as categoryName'
        )
        .orderBy(`product.${sortColumn}`, sortDirection)
        .limit(limit)
        .offset(skip),
      query.clone().count('* as count').first(),
    ]);

    const total = countResult.count;

    // Fetch variants (colors/sizes)
    const productIds = products.map(p => p.id);
    if (productIds.length > 0) {
      const variants = await knex('productvariant').whereIn('productId', productIds);
      products.forEach(p => {
        p.variants = variants.filter(v => v.productId === p.id);
      });
    }

    return sendPaginated(
      res,
      products,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.PRODUCTS_FOUND
    );
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productService.findById(id);

    if (!product) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Fetch collectionIds
    const collections = await knex('product_collection').where('productId', id).select('collectionId');
    product.collectionIds = collections.map(c => c.collectionId);

    // Fetch variants
    const variants = await knex('productvariant').where('productId', id);
    product.variants = variants;

    return sendSuccess(res, product, MESSAGES.PRODUCT_FOUND);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
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
      tags,
      isSale,
      salePrice,
      isActive,
      variants,
      imageUrls,
      trackStock,
    } = req.body;

    // Calculate total stock if variants exist
    let totalStock = stockQuantity || 0;
    if (variants && Array.isArray(variants) && variants.length > 0) {
      totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stockQuantity, 10) || 0), 0);
    }

    const category = await knex('productCategory').where('id', categoryId).first();
    if (!category) {
      throw new NotFoundError('Product category not found');
    }

    const product = await productService.create({
      categoryId,
      productName,
      description: description || null,
      descriptionEn: descriptionEn || null,
      price,
      stockQuantity: totalStock,
      productType,
      productTypeId: productTypeId === '' ? null : productTypeId,
      imageUrl: imageUrl || null,
      businessType,
      tags: tags || null,
      isSale: isSale === true || isSale === 'true' || isSale === 1 || isSale === '1',
      salePrice: salePrice ? parseFloat(salePrice) : null,
      isActive: isActive === undefined ? true : (isActive === true || isActive === 'true' || isActive === 1 || isActive === '1'),
      trackStock: trackStock === undefined ? true : (trackStock === true || trackStock === 'true' || trackStock === 1 || trackStock === '1'),
      imageUrls: imageUrls ? (typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls) : null,
      variants: variants // pass variants to productService.create
    });

    // Save collectionIds jika ada
    let colIds = req.body.collectionIds;
    if (colIds) {
      if (!Array.isArray(colIds)) colIds = [colIds];
      if (colIds.length > 0) {
        const colRecords = colIds.map(cId => ({ productId: product.id, collectionId: cId }));
        await knex('product_collection').insert(colRecords);
      }
    }

    return sendCreated(res, product, MESSAGES.PRODUCT_CREATED);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // DEBUG LOGGING
    try {
      require('fs').appendFileSync('debug-error.log', 'UPDATE PRODUCT PAYLOAD: ' + JSON.stringify(req.body) + '\n');
    } catch(e) {}

    const { productName, description, descriptionEn, price, stockQuantity, imageUrl, imageUrls, isActive, tags, isSale, salePrice, categoryId, productTypeId, variants, trackStock } = req.body;

    const existing = await productService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    const updateData = {};
    if (productName !== undefined) updateData.productName = productName;
    if (description !== undefined) updateData.description = description;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true' || isActive === 1 || isActive === '1';
    if (tags !== undefined) updateData.tags = tags;
    if (isSale !== undefined) updateData.isSale = isSale === true || isSale === 'true' || isSale === 1 || isSale === '1';
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
    if (trackStock !== undefined) updateData.trackStock = trackStock === true || trackStock === 'true' || trackStock === 1 || trackStock === '1';
    if (imageUrls !== undefined) updateData.imageUrls = imageUrls ? (typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls) : null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (productTypeId !== undefined) updateData.productTypeId = productTypeId === '' ? null : productTypeId;
    
    // Process variants and dynamic stock
    if (variants !== undefined) {
      updateData.variants = variants;
      if (Array.isArray(variants) && variants.length > 0) {
        updateData.stockQuantity = variants.reduce((sum, v) => sum + (parseInt(v.stockQuantity, 10) || 0), 0);
      }
    }

    const product = await productService.update(id, updateData);

    // Save collectionIds jika ada
    let colIds = req.body.collectionIds;
    if (colIds) {
      if (!Array.isArray(colIds)) colIds = [colIds];
      await knex('product_collection').where('productId', id).del();
      if (colIds.length > 0) {
        const colRecords = colIds.map(cId => ({ productId: id, collectionId: cId }));
        await knex('product_collection').insert(colRecords);
      }
    }

    return sendSuccess(res, product, MESSAGES.PRODUCT_UPDATED);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await productService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    await productService.deactivate(id);

    return sendSuccess(res, null, MESSAGES.PRODUCT_DELETED);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { businessType } = req.query;
    let query = knex('productCategory');

    if (businessType) {
      query = query.where('businessType', businessType);
    }

    const categories = await query.orderBy('categoryName', 'asc');

    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createVariant = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { variantName, sku, additionalPrice, stockQuantity } = req.body;

    const product = await productService.findById(productId);
    if (!product) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    const variantId = require('cuid')();
    const variant = {
      id: variantId,
      productId,
      variantName,
      sku,
      additionalPrice: additionalPrice || 0,
      stockQuantity: stockQuantity || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await knex('productVariant').insert(variant);

    return sendCreated(res, variant, 'Variant created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload product image
 * POST /api/products/upload-image
 * Requires: image file in 'image' field
 * Returns: filename and URL
 */
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    const { getFileUrl } = require('../middleware/upload');
    const fileUrl = getFileUrl(req.file.filename, 'products');

    return sendSuccess(
      res,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
      },
      'Image uploaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload product image and update product
 * POST /api/products/:id/upload-image
 * Requires: productId and image file
 * Returns: updated product with image
 */
const uploadProductImageAndUpdate = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    // Verify product exists
    const knex = require('../config/knex');
    const product = await knex('product')
      .where('id', productId)
      .select('*')
      .first();
    
    if (!product) {
      // Delete uploaded file if product not found
      const { deleteFile } = require('../middleware/upload');
      deleteFile(req.file.filename, 'products');
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    const { getFileUrl } = require('../middleware/upload');
    const fileUrl = getFileUrl(req.file.filename, 'products');

    // Update product with image URL
    await knex('product')
      .where('id', productId)
      .update({
        imageUrl: fileUrl,
        updatedAt: new Date(),
      });

    // Fetch updated product
    const updatedProduct = await knex('product')
      .where('id', productId)
      .select('*')
      .first();

    return sendSuccess(res, updatedProduct, 'Product image updated successfully');
  } catch (error) {
    next(error);
  }
};

const addProductColor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { colorName, hexCode, stockQuantity, imageUrl, imageUrlBack, imageUrlLeft, imageUrlRight } = req.body;
    
    // Check if product exists
    const knex = require('../config/knex');
    const product = await knex('product').where('id', id).first();
    if (!product) throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);

    const newColor = {
      id: require('cuid')(),
      productId: id,
      colorName,
      hexCode: hexCode || null,
      stockQuantity: stockQuantity || 0,
      imageUrl: imageUrl || null,
      imageUrlBack: imageUrlBack || null,
      imageUrlLeft: imageUrlLeft || null,
      imageUrlRight: imageUrlRight || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await knex('product_color_variant').insert(newColor);
    return sendCreated(res, newColor, 'Color variant created');
  } catch (error) {
    next(error);
  }
};

const updateProductColor = async (req, res, next) => {
  try {
    const { id, colorId } = req.params;
    const { colorName, hexCode, stockQuantity, imageUrl, imageUrlBack, imageUrlLeft, imageUrlRight } = req.body;
    const knex = require('../config/knex');
    
    const updateData = {
      colorName,
      hexCode,
      stockQuantity,
      updatedAt: new Date()
    };
    
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (imageUrlBack !== undefined) updateData.imageUrlBack = imageUrlBack;
    if (imageUrlLeft !== undefined) updateData.imageUrlLeft = imageUrlLeft;
    if (imageUrlRight !== undefined) updateData.imageUrlRight = imageUrlRight;
    
    const updated = await knex('product_color_variant')
      .where({ id: colorId, productId: id })
      .update(updateData);
      
    if (!updated) throw new NotFoundError('Color variant not found');
    return sendSuccess(res, { id: colorId }, 'Color variant updated');
  } catch (error) {
    next(error);
  }
};

const deleteProductColor = async (req, res, next) => {
  try {
    const { id, colorId } = req.params;
    const knex = require('../config/knex');
    const deleted = await knex('product_color_variant').where({ id: colorId, productId: id }).del();
    if (!deleted) throw new NotFoundError('Color variant not found');
    return sendSuccess(res, null, 'Color variant deleted');
  } catch (error) {
    next(error);
  }
};

const bulkDeleteProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty product IDs provided' });
    }
    const knex = require('../config/knex');
    await knex('product').whereIn('id', ids).update({ deletedAt: new Date(), isActive: false });
    return sendSuccess(res, { count: ids.length }, 'Products bulk deleted successfully');
  } catch (error) {
    next(error);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || isActive === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid request body' });
    }
    const knex = require('../config/knex');
    const activeVal = isActive === true || isActive === 'true' || isActive === 1 ? 1 : 0;
    await knex('product').whereIn('id', ids).update({ isActive: activeVal, updatedAt: new Date() });
    return sendSuccess(res, { count: ids.length }, 'Products bulk status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createVariant,
  uploadProductImage,
  uploadProductImageAndUpdate,
  addProductColor,
  updateProductColor,
  deleteProductColor,
  bulkDeleteProducts,
  bulkUpdateStatus,
};
