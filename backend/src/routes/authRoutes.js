// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. Existing Workspace Lookup
router.get('/lookup', authController.lookupWorkspace);

// 2. NEW: Fetch all users for the Flutter "Netflix" profile screen
router.get('/users', authController.getUsers);

// 3. NEW: Verify the PIN from the Flutter numpad
router.post('/verify-pin', authController.login);

// 4. (Optional) Keeping your original login route active just in case
router.post('/login', authController.login);

module.exports = router;