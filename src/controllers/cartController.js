// src/controllers/cartController.js

const cartService = require('../services/cartService');
const cartItemService = require('../services/cartItemService');
const productService = require('../services/productService');
const knex = require('../config/knex');
const { sendSuccess } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let cart = await cartService.getOrCreateCart(userId);

    // Get items dengan product info dan variant info
    const items = await knex('cartItem')
      .where('cartId', cart.id)
      .select('cartItem.*', 
        knex.raw('p.productName, p.price as productPrice, p.imageUrl, p.isActive, p.businessType'),
        knex.raw('v.variantName as size, v.color as color, v.imageUrl as variantImage')
      )
      .leftJoin('product as p', 'cartItem.productId', 'p.id')
      .leftJoin('productVariant as v', 'cartItem.variantId', 'v.id')
      .orderBy('cartItem.createdAt', 'desc');

    // Calculate total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    return sendSuccess(
      res, 
      { 
        ...cart, 
        items, 
        totalAmount 
      }, 
      MESSAGES.CART_FOUND
    );
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;

    const product = await productService.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    let unitPrice = product.price;

    if (variantId) {
      const variant = await knex('productVariant').where('id', variantId).first();
      if (!variant || variant.productId !== productId) {
        throw new NotFoundError('Product variant not found');
      }
      unitPrice += variant.additionalPrice;
    }

    let cart = await cartService.getOrCreateCart(userId);

    const cartItem = await cartItemService.addOrUpdate({
      cartId: cart.id,
      productId,
      variantId: variantId || null,
      quantity,
      price: unitPrice,
    });

    return sendSuccess(res, cartItem, MESSAGES.CART_ITEM_ADDED);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    const cart = await cartService.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const cartItem = await cartItemService.findById(itemId);
    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }

    const updatedItem = await cartItemService.updateQuantity(itemId, quantity);

    return sendSuccess(res, updatedItem, MESSAGES.CART_ITEM_UPDATED);
  } catch (error) {
    next(error);
  }
};



const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await cartService.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const cartItem = await cartItemService.findById(itemId);
    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }

    await cartItemService.delete(itemId);

    return sendSuccess(res, null, MESSAGES.CART_ITEM_REMOVED);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await cartService.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    await cartItemService.deleteAll(cart.id);
    await cartService.clear(cart.id);

    return sendSuccess(res, null, MESSAGES.CART_CLEARED);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
