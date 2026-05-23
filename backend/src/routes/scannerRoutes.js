const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scannerController');

// Route 1: The main receipt scanner
router.post('/scan', scannerController.uploadMiddleware, scannerController.scanInvoice);

// Route 2: The single-item expiry scanner
router.post('/expiry', scannerController.uploadMiddleware, scannerController.scanExpiry);

module.exports = router;