// src/middleware/errorHandler.js

const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma error handling
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Related record not found';
  }

  // JWT error handling
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  const response = {
    success: false,
    message,
  };

  if (err.details) {
    response.errors = err.details;
  }

  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode}: ${message}`);

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
