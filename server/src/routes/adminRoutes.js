const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAdminBookings,
  getAdminBookingDetails,
  getAdminUsers,
  getAdminDestinations,
  getAdminPackages,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Strict server-side security: every admin route requires authentication & admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/bookings', getAdminBookings);
router.get('/bookings/:id', getAdminBookingDetails);
router.get('/users', getAdminUsers);
router.get('/destinations', getAdminDestinations);
router.get('/packages', getAdminPackages);

module.exports = router;
