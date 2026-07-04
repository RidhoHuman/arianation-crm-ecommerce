// src/routes/webhooks.js

const express = require('express');
const router = express.Router();
const { updateCourierWebhook } = require('../controllers/courierWebhookController');
const { handleXenditWebhook, handleMidtransWebhook } = require('../controllers/webhookController');

router.post('/courier', updateCourierWebhook);
router.post('/xendit', handleXenditWebhook);
router.post('/midtrans', handleMidtransWebhook);

module.exports = router;
