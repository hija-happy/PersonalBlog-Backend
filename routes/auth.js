// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register user
router.post('/register', authController.register);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Login user
router.post('/login', authController.login);

// Request password reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', authController.resetPassword);

// Get user profile (protected route)
router.get('/me', auth, authController.getUserProfile);

module.exports = router;