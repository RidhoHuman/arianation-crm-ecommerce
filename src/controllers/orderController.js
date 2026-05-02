// src/controllers/orderController.js

const prisma = require('../config/database');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, userId, dateFrom, dateTo } = req.query;

    const where = {};

    if (['CUSTOMER'].includes(req.user.role)) {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = new Date(dateFrom);
      if (dateTo) where.orderDate.lte = new Date(dateTo);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { id: true, productName: true, imageUrl: true } },
              variant: { select: { id: true, variantName: true } },
            },
          },
          payment: { select: { id: true, status: true, method: true, amount: true } },
          tracking: { select: { id: true, status: true, carrier: true, trackingNumber: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return sendPaginated(res, orders, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, MESSAGES.ORDERS_FOUND);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            designRequest: true,
          },
        },
        payment: true,
        tracking: {
          include: { history: { orderBy: { timestamp: 'desc' } } },
        },
        designRequests: true,
      },
    });

    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    return sendSuccess(res, order, MESSAGES.ORDER_FOUND);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, deliveryAddress, notes, items } = req.body;

    let orderItems = [];

    if (items && Array.isArray(items) && items.length > 0) {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const variantIds = [...new Set(items.filter((item) => item.variantId).map((item) => item.variantId))];

      const [products, variants] = await prisma.$transaction([
        prisma.product.findMany({
          where: { id: { in: productIds } },
        }),
        prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
        }),
      ]);

      const productsById = new Map(products.map((product) => [product.id, product]));
      const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

      orderItems = items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product || !product.isActive) {
          throw new NotFoundError(`Product ${item.productId} not found`);
        }

        let unitPrice = product.price;
        if (item.variantId) {
          const variant = variantsById.get(item.variantId);
          if (variant) unitPrice += variant.additionalPrice;
        }

        return {
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice,
          subtotal: unitPrice * item.quantity,
          notes: item.notes || null,
        };
      });
    } else {
      const cart = await prisma.shoppingCart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestError(MESSAGES.CART_EMPTY);
      }

      orderItems = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        items: { create: orderItems },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, productName: true, price: true } },
            variant: true,
          },
        },
      },
    });

    if (!items) {
      const cart = await prisma.shoppingCart.findUnique({ where: { userId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    return sendCreated(res, order, MESSAGES.ORDER_CREATED);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status, notes: notes || order.notes },
    });

    if (['ADMIN', 'OWNER'].includes(req.user.role)) {
      await prisma.adminActivityLog.create({
        data: {
          adminId: req.user.id,
          action: 'ORDER_STATUS_UPDATED',
          targetId: id,
          targetType: 'Order',
          details: JSON.stringify({ previousStatus: order.status, newStatus: status }),
        },
      });
    }

    return sendSuccess(res, updatedOrder, MESSAGES.ORDER_UPDATED);
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestError(MESSAGES.ORDER_CANNOT_CANCEL);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return sendSuccess(res, updatedOrder, MESSAGES.ORDER_CANCELLED);
  } catch (error) {
    next(error);
  }
};

const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const tracking = await prisma.orderTracking.findUnique({
      where: { orderId: id },
      include: { history: { orderBy: { timestamp: 'desc' } } },
    });

    return sendSuccess(res, tracking, 'Tracking information retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllOrders, getOrderById, createOrder, updateOrderStatus, cancelOrder, getOrderTracking };
