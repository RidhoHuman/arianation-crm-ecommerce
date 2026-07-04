// src/controllers/paymentController.js

const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');
const knex = require('../config/knex');
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
    const { status } = req.query;

    const [payments, total] = await Promise.all([
      paymentService.findMany({ page, limit, status }),
      paymentService.count({ status }),
    ]);

    return sendPaginated(
      res,
      payments,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.PAYMENTS_FOUND
    );
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await paymentService.findById(id);

    if (!payment) {
      throw new NotFoundError(MESSAGES.PAYMENT_NOT_FOUND);
    }

    // Get order untuk validasi permission
    const order = await orderService.findById(payment.orderId);
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    return sendSuccess(res, payment, MESSAGES.PAYMENT_FOUND);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { orderId, method, customerDetails } = req.body;

    const order = await orderService.findById(orderId);

    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const existingPayment = await paymentService.findByOrderId(orderId);
    if (existingPayment && existingPayment.status === 'COMPLETED') {
      throw new BadRequestError(MESSAGES.PAYMENT_ALREADY_COMPLETED);
    }

    const transactionId = generateTransactionId();

    const paymentData = {
      orderId,
      amount: order.totalAmount,
      paymentMethod: method || order.paymentMethod,
      status: 'PENDING',
      transactionId,
    };

    if (method === 'QRIS' || order.paymentMethod === 'QRIS') {
      paymentData.qrisReference = `QRIS-${transactionId}`;
      const baseUrl = process.env.BASE_URL;
      if (baseUrl) {
        paymentData.qrisUrl = `${baseUrl}/api/payments/qris/${transactionId}`;
      }
    } else if (method === 'BANK_TRANSFER' || order.paymentMethod === 'BANK_TRANSFER') {
      const bankAccount = process.env.BANK_ACCOUNT_NUMBER;
      const bankName = process.env.BANK_NAME;
      const accountName = process.env.BANK_ACCOUNT_NAME;
      if (!bankAccount || !bankName || !accountName) {
        throw new BadRequestError('Bank transfer is not configured. Please contact support.');
      }
      paymentData.bankAccount = bankAccount;
      paymentData.bankName = bankName;
      paymentData.accountName = accountName;
    }

    // Midtrans Snap Token Generation
    const { snap } = require('../config/midtrans');
    
    // Fallback if customer details not fully provided by frontend
    const customer = req.user ? {
      first_name: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone || '081234567890'
    } : customerDetails;

    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: order.totalAmount
      },
      customer_details: customer,
    };

    let snapToken = null;
    let snapRedirectUrl = null;

    try {
      const snapResponse = await snap.createTransaction(parameter);
      snapToken = snapResponse.token;
      snapRedirectUrl = snapResponse.redirect_url;
      paymentData.qrisUrl = snapRedirectUrl; // We can repurpose this for the snap URL
    } catch (midtransError) {
      console.error('Midtrans Snap Error:', midtransError.message);
      // If Midtrans fails, we can either throw error or fallback to manual. We throw to be strict.
      throw new BadRequestError('Gagal memproses pembayaran melalui payment gateway');
    }

    let payment;
    if (existingPayment) {
      payment = await paymentService.update(existingPayment.id, paymentData);
    } else {
      payment = await paymentService.create(paymentData);
    }

    return res.status(201).json({
      success: true,
      message: MESSAGES.PAYMENT_CREATED,
      data: {
        ...payment,
        snapToken,
        snapRedirectUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, receiptUrl } = req.body;

    const payment = await paymentService.findById(id);
    if (!payment) {
      throw new NotFoundError(MESSAGES.PAYMENT_NOT_FOUND);
    }

    if (payment.status === 'COMPLETED') {
      throw new BadRequestError(MESSAGES.PAYMENT_ALREADY_COMPLETED);
    }

    const finalStatus = status || 'COMPLETED';

    const updatedPayment = await paymentService.updateStatus(id, finalStatus);

    if (updatedPayment.status === 'COMPLETED') {
      await orderService.updateStatus(payment.orderId, 'CONFIRMED');
    }

    await knex('adminActivityLog').insert({
      id: require('cuid')(),
      adminId: req.user.id,
      action: 'PAYMENT_VERIFIED',
      targetId: id,
      targetType: 'Payment',
      details: JSON.stringify({ status: updatedPayment.status }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return sendSuccess(res, updatedPayment, MESSAGES.PAYMENT_VERIFIED);
  } catch (error) {
    next(error);
  }
};

const getPaymentByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await orderService.findById(orderId);
    if (!order) {
      throw new NotFoundError(MESSAGES.ORDER_NOT_FOUND);
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      throw new AuthorizationError(MESSAGES.FORBIDDEN);
    }

    const payment = await paymentService.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundError(MESSAGES.PAYMENT_NOT_FOUND);
    }

    return sendSuccess(res, payment, MESSAGES.PAYMENT_FOUND);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  verifyPayment,
  getPaymentByOrder,
};
