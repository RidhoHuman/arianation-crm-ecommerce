// src/controllers/productController.js

const prisma = require('../config/database');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { categoryId, businessType, productType, isActive, search, minPrice, maxPrice } = req.query;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (businessType) where.businessType = businessType;
    if (productType) where.productType = productType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, categoryName: true, businessType: true } },
          variants: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return sendPaginated(res, products, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, MESSAGES.PRODUCTS_FOUND);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
      },
    });

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

    const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundError('Product category not found');
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        productName,
        description: description || null,
        price,
        stockQuantity: stockQuantity || 0,
        productType,
        imageUrl: imageUrl || null,
        businessType,
        variants: variants
          ? {
              create: variants.map((v) => ({
                variantName: v.variantName,
                sku: v.sku,
                additionalPrice: v.additionalPrice || 0,
                stockQuantity: v.stockQuantity || 0,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    return sendCreated(res, product, MESSAGES.PRODUCT_CREATED);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productName, description, price, stockQuantity, imageUrl, isActive } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
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

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, variants: true },
    });

    return sendSuccess(res, product, MESSAGES.PRODUCT_UPDATED);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return sendSuccess(res, null, MESSAGES.PRODUCT_DELETED);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { businessType } = req.query;
    const where = businessType ? { businessType } : {};

    const categories = await prisma.productCategory.findMany({
      where,
      orderBy: { categoryName: 'asc' },
    });

    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createVariant = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { variantName, sku, additionalPrice, stockQuantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        variantName,
        sku,
        additionalPrice: additionalPrice || 0,
        stockQuantity: stockQuantity || 0,
      },
    });

    return sendCreated(res, variant, 'Variant created successfully');
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
};
