// src/middleware/errorHandler.js

const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log full error details
  console.log('[ERROR HANDLER]', {
    name: err.name,
    message: err.message,
    code: err.code,
    statusCode: statusCode,
    path: req.path,
    method: req.method,
  });

  try {
    const fs = require('fs');
    fs.appendFileSync(
      'debug-error.log',
      new Date().toISOString() + ' ' + (err.stack || err.message) + '\n'
    );
  } catch (e) {}

  // Database error handling (MySQL / SQLite)
  if (err.code === 'ER_DUP_ENTRY' || err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'A record with this value already exists or violates constraint';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Related record not found or is in use';
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
