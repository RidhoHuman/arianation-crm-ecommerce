const express = require('express');
const router = express.Router();
const { getSignedUrl } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// Generate signed URL for private files (authenticated)
router.get('/signed-url', authenticate, getSignedUrl);

module.exports = router;
