const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

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

    let order;

    if (req.isGuest) {
      // GUEST CHECKOUT
      // Create guest order
      const guestOrder = await prisma.guestOrder.create({
        data: {
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          email: req.body.email, // Email provided in guest form
          address: sanitizedData.address,
          apartment: sanitizedData.apartment,
          city: sanitizedData.city,
          province: sanitizedData.province,
          postalCode: sanitizedData.postalCode,
          country: sanitizedData.country,
          phone: sanitizedData.phone,
          status: 'PENDING', // Payment pending
          total: 249000, // Should calculate from cart
        },
      });

      order = guestOrder;

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'GUEST_CHECKOUT_STARTED',
          guestOrderId: guestOrder.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    } else {
      // AUTHENTICATED CUSTOMER CHECKOUT
      const customerOrder = await prisma.order.create({
        data: {
          userId: req.user.id,
          totalAmount: 249000, // Should calculate from cart
          status: 'PENDING',
          paymentMethod: 'COD',
          deliveryAddress: [
            `${sanitizedData.firstName} ${sanitizedData.lastName}`,
            sanitizedData.address,
            sanitizedData.apartment,
            sanitizedData.city,
            sanitizedData.province,
            sanitizedData.postalCode,
            sanitizedData.country,
            sanitizedData.phone,
          ].filter(Boolean).join(', '),
          notes: req.body.notes || null,
        },
      });

      order = customerOrder;

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CUSTOMER_CHECKOUT_STARTED',
          orderId: customerOrder.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

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

    let order;

    if (req.isGuest) {
      order = await prisma.guestOrder.findUnique({
        where: { id: orderId },
      });
    } else {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      // Check ownership
      if (order && order.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
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
