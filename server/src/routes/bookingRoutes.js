const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// All booking operations require valid authentication
router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id')
  .get(protect, getBookingById);

router.route('/:id/cancel')
  .patch(protect, cancelBooking);

module.exports = router;
