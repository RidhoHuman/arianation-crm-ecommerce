// src/routes/designRequests.js

const express = require('express');
const router = express.Router();
const {
  getAllDesignRequests,
  getDesignRequestById,
  createDesignRequest,
  updateDesignRequest,
  submitDesignRequest,
  addFeedback,
} = require('../controllers/designRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');

// All design request routes require authentication
router.use(authenticate);

router.get('/', getAllDesignRequests);
router.post('/', validateBody(schemas.createDesignRequest), createDesignRequest);
router.get('/:id', getDesignRequestById);
router.put('/:id', updateDesignRequest);
router.put('/:id/submit', submitDesignRequest);
router.post('/:id/feedback', authorize('ADMIN', 'OWNER', 'DESIGN_STAFF'), addFeedback);

module.exports = router;
