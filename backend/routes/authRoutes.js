const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
  registerUser, 
  loginUser, 
  verifyOTP, 
  resendOTP,
  getMe, 
  getLeaderboard, 
  googleAuth,
  testEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rate limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts
  message: { message: "Too many attempts, please try again after 15 minutes" }
});

router.post('/signup', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google', googleAuth);
router.post('/test-email', testEmail);
router.get('/me', protect, getMe);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
