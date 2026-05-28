// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/lookup',      authController.lookupWorkspace);
router.post('/verify-pin', authController.login);
router.post('/login',      authController.login);

// User management — specific routes BEFORE parametric ones
router.get('/users/all',                     authController.getAllUsers);
router.post('/users/create',                 authController.createUser);
router.put('/users/:user_id/pin',            authController.changePin);
router.put('/users/:user_id/toggle-active',  authController.toggleUserActive);

router.get('/users', authController.getUsers);

module.exports = router;