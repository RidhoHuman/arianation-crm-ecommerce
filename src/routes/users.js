// src/routes/users.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All routes require authentication
router.use(generalLimiter, authenticate);

// Admin/Owner only
router.get('/', authorize('ADMIN', 'OWNER'), getAllUsers);

// Profile management (own user)
router.get('/me', (req, res, next) => {
  req.params.id = req.user.id;
  return getUserById(req, res, next);
});
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Specific user operations
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('ADMIN', 'OWNER'), deleteUser);

module.exports = router;
