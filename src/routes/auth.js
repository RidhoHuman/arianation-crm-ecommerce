// src/routes/auth.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, logout, refreshToken, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

router.post('/register', authLimiter, validateBody(schemas.register), register);
router.post('/login', authLimiter, validateBody(schemas.login), login);
router.post('/logout', authLimiter, authenticate, logout);
router.post('/refresh-token', authLimiter, refreshToken);
router.get('/me', authLimiter, authenticate, getMe);

module.exports = router;
