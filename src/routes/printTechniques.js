const express = require('express');
const router = express.Router();
const printTechniqueController = require('../controllers/printTechniqueController');

// Public route to get all active print techniques
router.get('/', printTechniqueController.getAllActive);

module.exports = router;
