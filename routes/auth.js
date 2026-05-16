const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // Access token: 15 minutes
const REFRESH_EXPIRES_IN = '7d'; // Refresh token: 7 days

// Rate limiting helper
const loginAttempts = new Map();

const checkRateLimit = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
  const now = Date.now();
  
  // Reset after 15 minutes
  if (now - attempts.timestamp > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 0, timestamp: now });
    return true;
  }
  
  if (attempts.count >= 5) {
    return false;
  }
  
  return true;
};

const incrementAttempt = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
  attempts.count += 1;
  loginAttempts.set(email, attempts);
};

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Rate limiting
    if (!checkRateLimit(email)) {
      return res.status(429).json({ 
        message: 'Too many login attempts. Please try again after 15 minutes.' 
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      incrementAttempt(email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      incrementAttempt(email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on success
    loginAttempts.delete(email);

    // Create JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );

    // Store refresh token in DB (for revocation)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set secure HttpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'Login successful',
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// REGISTER ENDPOINT
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password (TIER 2: bcryptjs with 10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role = 'customer'
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'customer', // Default role
      },
    });

    // Send verification email (implement email service)
    // await sendVerificationEmail(user.email, user.id);

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// LOGOUT ENDPOINT
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Blacklist refresh token
    await prisma.refreshToken.update(
      { where: { token: req.cookies.refreshToken } },
      { data: { revokedAt: new Date() } }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// REFRESH TOKEN ENDPOINT
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Check if token is revoked
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.revokedAt) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Create new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;
