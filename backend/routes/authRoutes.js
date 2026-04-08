const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getLeaderboard, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
