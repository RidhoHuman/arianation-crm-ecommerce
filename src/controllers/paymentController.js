// src/controllers/paymentController.js

const prisma = require('../config/database');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { MESSAGES } = require('../utils/constants');

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, method } = req.query;

    const where = {};
    if (status) where.status = status;
    if (method) where.method = method;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true, userId: true, totalAmount: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return sendPaginated(res, payments, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, MESSAGES.PAYMENTS_FOUND);
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: { select: { id: true, productName: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError(MESSAGES.PAYMENT_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && payment.order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    return sendSuccess(res, payment, MESSAGES.PAYMENT_FOUND);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { orderId, method } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    if (order.payment && order.payment.status === 'COMPLETED') {
      throw new BadRequestError(MESSAGES.PAYMENT_ALREADY_COMPLETED);
    }

    const transactionId = generateTransactionId();

    const paymentData = {
      orderId,
      amount: order.totalAmount,
      method: method || order.paymentMethod,
      status: 'PENDING',
      transactionId,
    };

    if (method === 'QRIS' || order.paymentMethod === 'QRIS') {
      paymentData.qrisReference = `QRIS-${transactionId}`;
      paymentData.qrisUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/api/payments/qris/${transactionId}`;
    } else if (method === 'BANK_TRANSFER' || order.paymentMethod === 'BANK_TRANSFER') {
      paymentData.bankAccount = process.env.BANK_ACCOUNT_NUMBER || '';
      paymentData.bankName = process.env.BANK_NAME || '';
      paymentData.accountName = process.env.BANK_ACCOUNT_NAME || '';
    }

    let payment;
    if (order.payment) {
      payment = await prisma.payment.update({
        where: { orderId },
        data: paymentData,
      });
    } else {
      payment = await prisma.payment.create({
        data: paymentData,
      });
    }

    return sendCreated(res, payment, MESSAGES.PAYMENT_CREATED);
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, receiptUrl } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundError(MESSAGES.PAYMENT_NOT_FOUND);
    }

    if (payment.status === 'COMPLETED') {
      throw new BadRequestError(MESSAGES.PAYMENT_ALREADY_COMPLETED);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: status || 'COMPLETED',
        paymentDate: status === 'COMPLETED' ? new Date() : null,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        notes: notes || null,
        receiptUrl: receiptUrl || null,
      },
    });

    if (updatedPayment.status === 'COMPLETED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      });
    }

    await prisma.adminActivityLog.create({
      data: {
        adminId: req.user.id,
        action: 'PAYMENT_VERIFIED',
        targetId: id,
        targetType: 'Payment',
        details: JSON.stringify({ status: updatedPayment.status }),
      },
    });

    return sendSuccess(res, updatedPayment, MESSAGES.PAYMENT_VERIFIED);
  } catch (error) {
    next(error);
  }
};

const getPaymentByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const payment = await prisma.payment.findUnique({ where: { orderId } });

    return sendSuccess(res, payment, MESSAGES.PAYMENT_FOUND);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllPayments, getPaymentById, createPayment, verifyPayment, getPaymentByOrder };
