// src/routes/designRequests.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getAllDesignRequests,
  getDesignRequestById,
  createDesignRequest,
  updateDesignRequest,
  submitDesignRequest,
  addFeedback,
  deleteDesignRequest,
} = require('../controllers/designRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { uploadDesign } = require('../middleware/upload');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All design request routes require authentication
router.use(generalLimiter, authenticate);

router.get('/', getAllDesignRequests);
router.post('/', uploadDesign, createDesignRequest);
router.get('/:id', getDesignRequestById);
router.put('/:id', updateDesignRequest);
router.patch('/:id', updateDesignRequest);
router.put('/:id/submit', submitDesignRequest);
router.post('/:id/feedback', authorize('ADMIN', 'OWNER', 'DESIGN_STAFF'), addFeedback);
router.delete('/:id', deleteDesignRequest);

module.exports = router;
