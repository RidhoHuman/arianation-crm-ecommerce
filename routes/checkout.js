const express = require('express');
const jwt = require('jsonwebtoken');
const cuid = require('cuid');
const knex = require('../src/config/knex');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT
const verifyAuth = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    // Allow guest checkout
    req.isGuest = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.isGuest = false;
    next();
  } catch (err) {
    req.isGuest = true;
    next();
  }
};

// CHECKOUT ENDPOINT
router.post('/checkout', verifyAuth, async (req, res) => {
  try {
    const {
      country,
      firstName,
      lastName,
      address,
      apartment,
      city,
      province,
      postalCode,
      phone,
      cartItems, // Should come from frontend
    } = req.body;

    // Validation
    if (!firstName || !lastName || !address || !city || !postalCode || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Sanitize inputs (prevent XSS)
    const sanitizeInput = (str) => {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    const sanitizedData = {
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      address: sanitizeInput(address),
      apartment: sanitizeInput(apartment),
      city: sanitizeInput(city),
      province: sanitizeInput(province),
      postalCode: sanitizeInput(postalCode),
      country: sanitizeInput(country),
      phone: sanitizeInput(phone),
    };

    const orderId = cuid();
    const orderNumber = `ORDER-${Date.now()}`;

    await knex('order').insert({
      id: orderId,
      orderNumber,
      userId: req.isGuest ? null : req.user.id,
      totalAmount: 249000,
      paymentMethod: req.isGuest ? 'GUEST_CHECKOUT' : 'COD',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const order = await knex('order').where('id', orderId).first();

    res.status(201).json({
      message: 'Checkout successful. Proceed to payment.',
      orderId: order.id,
      orderData: {
        id: order.id,
        total: order.total || order.totalAmount,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET CHECKOUT STATUS
router.get('/checkout/:orderId', verifyAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await knex('order').where('id', orderId).first();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!req.isGuest && order.userId && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      order: {
        id: order.id,
        status: order.status,
        total: order.total || order.totalAmount,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Get checkout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
