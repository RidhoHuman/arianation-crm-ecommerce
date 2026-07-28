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

const { config } = require('../config/env');
const knex = require('../config/knex');

const mockOAuthHandler = (provider) => async (req, res, next) => {
  try {
    const email = `mock.${provider}@example.com`;
    let user = await knex('user').where({ email }).first();

    if (!user) {
      const cuid = require('cuid');
      const bcrypt = require('bcryptjs');
      const randomPassword = cuid() + Date.now().toString();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUser = {
        id: cuid(),
        email: email,
        password: hashedPassword,
        fullName: `Mock ${provider} User`,
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await knex.transaction(async (trx) => {
        await trx('user').insert(newUser);
        const now = new Date();
        await trx('customerProfile').insert({
          id: cuid(),
          userId: newUser.id,
          createdAt: now,
          updatedAt: now,
        });
        await trx('customerMetrics').insert({
          id: cuid(),
          userId: newUser.id,
          createdAt: now,
          updatedAt: now,
        });
        await trx('shoppingCart').insert({
          id: cuid(),
          userId: newUser.id,
          createdAt: now,
          updatedAt: now,
        });
      });
      user = newUser;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

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
  (req, res, next) => {
    if (!config.google.clientId || !config.google.clientSecret) {
      return mockOAuthHandler('Google')(req, res, oauthCallback);
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!config.google.clientId || !config.google.clientSecret) {
      return res.redirect('/login?error=oauth_failed');
    }
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' })(req, res, next);
  },
  oauthCallback
);

// Facebook OAuth routes
router.get(
  '/oauth/facebook',
  (req, res, next) => {
    if (!config.facebook.appId || !config.facebook.appSecret) {
      return mockOAuthHandler('Facebook')(req, res, oauthCallback);
    }
    passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false })(req, res, next);
  }
);

router.get(
  '/facebook/callback',
  (req, res, next) => {
    if (!config.facebook.appId || !config.facebook.appSecret) {
      return res.redirect('/login?error=oauth_failed');
    }
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: '/login?error=oauth_failed',
    })(req, res, next);
  },
  oauthCallback
);

module.exports = router;
