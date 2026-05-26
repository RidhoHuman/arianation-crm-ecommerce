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
    const { categoryId, businessType, productType, isActive, search, minPrice, maxPrice } =
      req.query;

    // Build Knex query dengan filter
    let query = knex('product');

    if (categoryId) query = query.where('categoryId', categoryId);
    if (businessType) query = query.where('businessType', businessType);
    if (productType) query = query.where('productType', productType);
    if (isActive !== undefined) query = query.where('isActive', isActive === 'true' ? 1 : 0);
    if (search) {
      query = query.where((builder) => {
        builder.where('productName', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`);
      });
    }
    if (minPrice) query = query.where('price', '>=', parseFloat(minPrice));
    if (maxPrice) query = query.where('price', '<=', parseFloat(maxPrice));

    const [products, countResult] = await Promise.all([
      query.clone()
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
        .offset(skip),
      query.clone().count('* as count').first(),
    ]);

    const total = countResult.count;

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
      price,
      stockQuantity,
      productType,
      imageUrl,
      businessType,
      variants,
    } = req.body;

    const category = await knex('productCategory').where('id', categoryId).first();
    if (!category) {
      throw new NotFoundError('Product category not found');
    }

    const product = await productService.create({
      categoryId,
      productName,
      description: description || null,
      price,
      stockQuantity: stockQuantity || 0,
      productType,
      imageUrl: imageUrl || null,
      businessType,
    });

    // Create variants jika ada
    if (variants && Array.isArray(variants)) {
      const variantRecords = variants.map((v) => ({
        id: require('cuid')(),
        productId: product.id,
        variantName: v.variantName,
        sku: v.sku,
        additionalPrice: v.additionalPrice || 0,
        stockQuantity: v.stockQuantity || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await knex('productVariant').insert(variantRecords);
    }

    return sendCreated(res, product, MESSAGES.PRODUCT_CREATED);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, description, price, stockQuantity, imageUrl, isActive } = req.body;

    const existing = await productService.findById(id);
    if (!existing) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    const updateData = {};
    if (productName !== undefined) updateData.productName = productName;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await productService.update(id, updateData);

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
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      // Delete uploaded file if product not found
      const { deleteFile } = require('../middleware/upload');
      deleteFile(req.file.filename, 'products');
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    const { getFileUrl } = require('../middleware/upload');
    const fileUrl = getFileUrl(req.file.filename, 'products');

    // Update product with image URL
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: fileUrl },
      include: {
        category: { select: { id: true, categoryName: true } },
        variants: true,
      },
    });

    return sendSuccess(res, updatedProduct, 'Product image updated successfully');
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
};
