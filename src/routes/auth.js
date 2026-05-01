// src/routes/auth.js

const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

router.post('/register', validateBody(schemas.register), register);
router.post('/login', validateBody(schemas.login), login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);

module.exports = router;
