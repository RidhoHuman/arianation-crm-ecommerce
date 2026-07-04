const express = require('express');
const router = express.Router();
const { getPortfolio, getFaqs, getPrintTechniques } = require('../controllers/designInfoController');

router.get('/portfolio', getPortfolio);
router.get('/faqs', getFaqs);
router.get('/print-techniques', getPrintTechniques);

module.exports = router;
