// src/routes/auth.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  oauthCallback,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const passport = require('passport');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

router.post('/register', authLimiter, validateBody(schemas.register), register);
router.post('/login', authLimiter, validateBody(schemas.login), login);
router.post('/logout', authLimiter, authenticate, logout);
router.post('/refresh-token', authLimiter, refreshToken);
router.get('/me', authLimiter, authenticate, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
// Google OAuth routes
router.get(
  '/oauth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  oauthCallback
);

// Facebook OAuth routes
router.get(
  '/oauth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }),
  oauthCallback
);

module.exports = router;
