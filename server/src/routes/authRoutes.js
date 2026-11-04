const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  googleAuth,
  verifyOtp,
  resendOtp,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
