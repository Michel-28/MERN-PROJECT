const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const paymentRoutes = require('./paymentRoutes');
const destinationRoutes = require('./destinationRoutes');
const packageRoutes = require('./packageRoutes');
const tripRoutes = require('./tripRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const bookingRoutes = require('./bookingRoutes');
const adminRoutes = require('./adminRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TravelEase API',
    timestamp: new Date().toISOString(),
    auth: 'JWT & Role-Based Access Control',
    payments: 'Razorpay & Test Gateway Verification',
  });
});

// Resource endpoints
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/destinations', destinationRoutes);
router.use('/packages', packageRoutes);
router.use('/trips', tripRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
