const express = require('express');
const router = express.Router();

// Import your Supabase controller
const inventoryController = require('../controllers/inventoryController');

// Route 1: POST request to save the full receipt and all its items
router.post('/save-receipt', inventoryController.saveReceiptData);

// Route 2: PUT request to update a single batch's expiration date (e.g., the tuna can)
router.put('/update-expiry', inventoryController.updateBatchExpiry);

module.exports = router;

// Route 3: GET request to fetch all active stock
router.get('/active', inventoryController.getActiveInventory);

// Route 4: GET request to fetch items requiring a manual date scan
router.get('/pending-scans', inventoryController.getPendingScans);

//retrieves activity logs
router.get('/activity-log', inventoryController.getActivityLog);

router.get('/dashboard', inventoryController.getDashboardStats);
router.put('/batch/:batch_id',    inventoryController.updateBatch);