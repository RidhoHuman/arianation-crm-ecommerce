// src/controllers/wishlistController.js

const knex = require('../config/knex');
const { sendSuccess } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch wishlist joined with product details
    const wishlistItems = await knex('wishlist')
      .join('product', 'wishlist.productId', 'product.id')
      .select(
        'wishlist.productId',
        'wishlist.createdAt as addedAt',
        'product.productName',
        'product.price',
        'product.imageUrl',
        'product.isActive'
      )
      .where('wishlist.userId', userId)
      .orderBy('wishlist.createdAt', 'desc');

    return sendSuccess(res, wishlistItems, 'Wishlist retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Check if product exists
    const product = await knex('product').where('id', productId).first();
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if already in wishlist
    const existing = await knex('wishlist')
      .where({ userId, productId })
      .first();

    if (existing) {
      throw new BadRequestError('Product is already in your wishlist');
    }

    const id = require('cuid')();
    await knex('wishlist').insert({
      id,
      userId,
      productId,
      createdAt: new Date(),
    });

    return sendSuccess(res, null, 'Product added to wishlist');
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const deleted = await knex('wishlist')
      .where({ userId, productId })
      .delete();

    if (!deleted) {
      throw new NotFoundError('Product not found in wishlist');
    }

    return sendSuccess(res, null, 'Product removed from wishlist');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
