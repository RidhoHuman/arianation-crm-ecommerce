// src/routes/webhooks.js

const express = require('express');
const router = express.Router();
const { updateCourierWebhook } = require('../controllers/courierWebhookController');

router.post('/courier', updateCourierWebhook);

module.exports = router;
