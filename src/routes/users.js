// src/routes/users.js

const express = require('express');
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

// All routes require authentication
router.use(authenticate);

// Admin/Owner only
router.get('/', authorize('ADMIN', 'OWNER'), getAllUsers);

// Profile management (own user)
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Specific user operations
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('ADMIN', 'OWNER'), deleteUser);

module.exports = router;
