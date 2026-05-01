// src/middleware/validation.js

const { ValidationError } = require('../utils/errors');

const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push({ field, message: `${field} must be a string` });
        continue;
      }

      if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
        errors.push({ field, message: `${field} must be a number` });
        continue;
      }

      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({ field, message: `${field} must be a boolean` });
        continue;
      }

      if (rules.type === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must not exceed ${rules.maxLength} characters` });
        }
        if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({ field, message: `${field} must be a valid email address` });
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
        }
      }

      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ field, message: `${field} must be at least ${rules.min}` });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({ field, message: `${field} must not exceed ${rules.max}` });
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
};

const schemas = {
  register: {
    email: { required: true, type: 'string', email: true },
    password: { required: true, type: 'string', minLength: 6 },
    fullName: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  },
  login: {
    email: { required: true, type: 'string', email: true },
    password: { required: true, type: 'string' },
  },
  createProduct: {
    productName: { required: true, type: 'string', minLength: 2, maxLength: 200 },
    price: { required: true, type: 'number', min: 0 },
    categoryId: { required: true, type: 'string' },
    productType: { required: true, type: 'string', enum: ['KAOS', 'ATRIBUT', 'SABLON_TEMPLATE'] },
    businessType: { required: true, type: 'string', enum: ['FASHION_RETAIL', 'SABLON_SERVICE'] },
  },
  addToCart: {
    productId: { required: true, type: 'string' },
    quantity: { required: true, type: 'number', min: 1 },
  },
  createOrder: {
    paymentMethod: { required: true, type: 'string', enum: ['QRIS', 'BANK_TRANSFER', 'COD'] },
  },
  createDesignRequest: {
    designTitle: { required: true, type: 'string', minLength: 2, maxLength: 200 },
    designFileUrl: { required: true, type: 'string' },
    fileType: { required: true, type: 'string', enum: ['PNG', 'JPG', 'PDF', 'AI', 'CDR'] },
    quantity: { required: true, type: 'number', min: 1 },
  },
};

module.exports = { validateBody, schemas };
