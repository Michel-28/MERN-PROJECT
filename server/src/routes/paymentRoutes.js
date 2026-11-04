const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  handlePaymentFailure,
  getReceipt,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failure', protect, handlePaymentFailure);
router.get('/receipt/:bookingId', protect, getReceipt);

module.exports = router;
