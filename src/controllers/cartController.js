// src/controllers/cartController.js

const prisma = require('../config/database');
const { sendSuccess } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.shoppingCart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, productName: true, price: true, imageUrl: true, isActive: true } },
            variant: { select: { id: true, variantName: true, sku: true, additionalPrice: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.shoppingCart.create({
        data: { userId },
        include: { items: true },
      });
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

    return sendSuccess(res, { ...cart, totalAmount }, MESSAGES.CART_FOUND);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new NotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
    }

    let unitPrice = product.price;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || variant.productId !== productId) {
        throw new NotFoundError('Product variant not found');
      }
      unitPrice += variant.additionalPrice;
    }

    let cart = await prisma.shoppingCart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.shoppingCart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null },
    });

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          subtotal: unitPrice * newQuantity,
        },
        include: {
          product: { select: { id: true, productName: true, price: true, imageUrl: true } },
          variant: true,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          unitPrice,
          subtotal: unitPrice * quantity,
        },
        include: {
          product: { select: { id: true, productName: true, price: true, imageUrl: true } },
          variant: true,
        },
      });
    }

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

    const cart = await prisma.shoppingCart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        subtotal: cartItem.unitPrice * quantity,
      },
      include: {
        product: { select: { id: true, productName: true, price: true, imageUrl: true } },
        variant: true,
      },
    });

    return sendSuccess(res, updatedItem, MESSAGES.CART_ITEM_UPDATED);
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await prisma.shoppingCart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return sendSuccess(res, null, MESSAGES.CART_ITEM_REMOVED);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.shoppingCart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return sendSuccess(res, null, MESSAGES.CART_CLEARED);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
