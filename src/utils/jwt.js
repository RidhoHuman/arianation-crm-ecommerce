// src/utils/jwt.js

const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('./errors');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    }
    throw new AuthenticationError('Invalid token');
  }
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};
