const crypto = require('crypto');
const Booking = require('../models/Booking');
const TourPackage = require('../models/TourPackage');
const Payment = require('../models/Payment');

// Helper to generate unique booking reference
const generateBookingRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'TE-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

// GET /api/v1/bookings
// Authenticated user gets their own bookings
exports.getBookings = async (req, res, next) => {
  try {
    const user = req.user;
    let filter = {};

    if (user.role === 'admin' && req.query.all === 'true') {
      // Admin requesting all bookings
      filter = {};
    } else {
      // Normal user: strictly scoped to own account
      filter = {
        $or: [
          { user: user._id },
          { email: user.email.toLowerCase().trim() },
        ],
      };
    }

    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('package')
      .populate('payment')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/bookings/:id
// Retrieve single booking with strict ownership check
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let booking;

    if (id.startsWith('TE-')) {
      booking = await Booking.findOne({ bookingReference: id })
        .populate('package')
        .populate('payment')
        .populate('user', 'name email phone');
    } else {
      booking = await Booking.findById(id)
        .populate('package')
        .populate('payment')
        .populate('user', 'name email phone');
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership verification
    const isOwner =
      (booking.user && booking.user._id.toString() === req.user._id.toString()) ||
      booking.email.toLowerCase() === req.user.email.toLowerCase() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this booking',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/bookings
// Create a pending reservation awaiting payment verification
exports.createBooking = async (req, res, next) => {
  try {
    const {
      packageId,
      departureDate,
      travelerCount,
      contactPhone,
      specialRequests,
      customerName,
    } = req.body;

    if (!packageId || !departureDate || !travelerCount) {
      return res.status(400).json({
        success: false,
        message: 'Tour package, departure date, and traveler count are required',
      });
    }

    const count = parseInt(travelerCount, 10);
    if (isNaN(count) || count < 1) {
      return res.status(400).json({
        success: false,
        message: 'Traveler count must be at least 1 person',
      });
    }

    const tourPackage = await TourPackage.findById(packageId).populate('destination');
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found',
      });
    }

    const depDate = new Date(departureDate);
    if (isNaN(depDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid departure date provided',
      });
    }

    // Capacity checking for this departure date
    const startOfDay = new Date(depDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(depDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      package: tourPackage._id,
      status: { $in: ['Confirmed', 'Pending Payment'] },
      departureDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const bookedCount = existingBookings.reduce((sum, b) => sum + b.travelerCount, 0);
    const capacity = tourPackage.capacity || 20;
    const availableSpots = capacity - bookedCount;

    if (count > availableSpots) {
      return res.status(400).json({
        success: false,
        message: `Only ${Math.max(0, availableSpots)} spot(s) remaining for this departure. Requested: ${count}`,
      });
    }

    // Server-side authoritative price calculation (never trust client total)
    const pricePerTraveler = tourPackage.pricePerTraveler;
    const totalAmount = pricePerTraveler * count;

    // Generate collision-resistant unique reference
    let bookingReference = generateBookingRef();
    let collision = await Booking.findOne({ bookingReference });
    while (collision) {
      bookingReference = generateBookingRef();
      collision = await Booking.findOne({ bookingReference });
    }

    const destinationName = tourPackage.destination?.name || 'Popular Destination';

    const booking = await Booking.create({
      bookingReference,
      user: req.user._id,
      email: req.user.email.toLowerCase().trim(),
      customerName: customerName ? customerName.trim() : req.user.name,
      contactPhone: contactPhone ? contactPhone.trim() : req.user.phone || '',
      package: tourPackage._id,
      packageTitleSnapshot: tourPackage.title,
      destinationSnapshot: destinationName,
      departureDate: depDate,
      travelerCount: count,
      pricePerTraveler,
      totalAmount,
      currency: tourPackage.currency || 'INR',
      status: 'Pending Payment',
      paymentStatus: 'pending',
      specialRequests: specialRequests ? specialRequests.trim() : '',
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Pending booking created. Proceed to payment gateway.',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/bookings/:id/cancel
// User or Admin initiates cancellation and refund evaluation
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const booking = await Booking.findById(id).populate('package');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership check
    const isOwner =
      (booking.user && booking.user.toString() === req.user._id.toString()) ||
      booking.email.toLowerCase() === req.user.email.toLowerCase() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot cancel this booking',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled',
      });
    }

    // Evaluate refund policy
    // If departure date is > 7 days away: 100% refund
    // If departure date is 3-7 days away: 70% refund
    // If departure date < 48 hours: no refund
    const now = new Date();
    const departure = new Date(booking.departureDate);
    const diffDays = Math.ceil((departure - now) / (1000 * 60 * 60 * 24));

    let refundPercentage = 100;
    if (diffDays < 2) {
      refundPercentage = 0;
    } else if (diffDays <= 7) {
      refundPercentage = 70;
    }

    const wasPaid = booking.paymentStatus === 'paid';
    const refundAmount = wasPaid ? Math.round((booking.totalAmount * refundPercentage) / 100) : 0;
    const refundStatus = wasPaid
      ? refundAmount > 0
        ? 'processed'
        : 'ineligible'
      : 'none';

    booking.status = 'Cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      reason,
      cancelledBy: req.user.role === 'admin' ? 'admin' : 'user',
      refundStatus,
      refundAmount,
      refundTransactionId: wasPaid && refundAmount > 0 ? `ref_test_${Date.now()}` : null,
    };

    if (wasPaid && refundAmount > 0) {
      booking.paymentStatus = 'refunded';
      // Also update linked Payment model
      await Payment.findOneAndUpdate(
        { booking: booking._id },
        {
          status: 'refunded',
          'refund.refundId': booking.cancellation.refundTransactionId,
          'refund.amount': refundAmount,
          'refund.status': 'refunded',
          'refund.refundedAt': new Date(),
          'refund.reason': reason,
        }
      );
    }

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: wasPaid
        ? `Booking cancelled. Test refund of ₹${refundAmount.toLocaleString('en-IN')} (${refundPercentage}%) has been processed to your original payment method.`
        : 'Booking cancelled successfully.',
    });
  } catch (error) {
    next(error);
  }
};
