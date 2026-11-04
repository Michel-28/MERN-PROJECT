const Destination = require('../models/Destination');
const TourPackage = require('../models/TourPackage');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');

// GET /api/v1/admin/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalDestinations = await Destination.countDocuments();
    const totalPackages = await TourPackage.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'Confirmed' });
    const pendingPaymentBookings = await Booking.countDocuments({ status: 'Pending Payment' });
    const paymentFailedBookings = await Booking.countDocuments({ status: 'Payment Failed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Cancelled' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Strictly verified payment revenue: sum totalAmount only for confirmed/paid bookings
    const revenueAggregation = await Booking.aggregate([
      { $match: { status: 'Confirmed', paymentStatus: 'paid' } },
      { $group: { _id: null, totalValue: { $sum: '$totalAmount' } } },
    ]);
    const totalVerifiedPaymentValue =
      revenueAggregation.length > 0 ? revenueAggregation[0].totalValue : 0;

    // Sum refunded amount
    const refundAggregation = await Booking.aggregate([
      { $match: { 'cancellation.refundAmount': { $gt: 0 } } },
      { $group: { _id: null, totalRefund: { $sum: '$cancellation.refundAmount' } } },
    ]);
    const totalRefundedValue =
      refundAggregation.length > 0 ? refundAggregation[0].totalRefund : 0;

    // Recent 8 bookings
    const recentBookings = await Booking.find()
      .populate('package')
      .populate('payment')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(8);

    // Breakdown for status chart
    const statusData = [
      { name: 'Confirmed (Paid)', count: confirmedBookings, color: '#0d9488' },
      { name: 'Pending Payment', count: pendingPaymentBookings, color: '#f59e0b' },
      { name: 'Payment Failed', count: paymentFailedBookings, color: '#ef4444' },
      { name: 'Cancelled', count: cancelledBookings, color: '#64748b' },
    ];

    res.json({
      success: true,
      stats: {
        totalDestinations,
        totalPackages,
        totalBookings,
        confirmedBookings,
        pendingPaymentBookings,
        paymentFailedBookings,
        cancelledBookings,
        totalUsers,
        totalDemoBookingValue: totalVerifiedPaymentValue,
        totalRefundedValue,
      },
      recentBookings,
      statusData,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/bookings
exports.getAdminBookings = async (req, res, next) => {
  try {
    const { search, status, paymentStatus, sort } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { packageTitleSnapshot: { $regex: search, $options: 'i' } },
        { destinationSnapshot: { $regex: search, $options: 'i' } },
        { paymentReference: { $regex: search, $options: 'i' } },
      ];
    }

    let query = Booking.find(filter)
      .populate('package')
      .populate('payment')
      .populate('user', 'name email phone');

    if (sort === 'date-asc') {
      query = query.sort({ createdAt: 1 });
    } else if (sort === 'amount-desc') {
      query = query.sort({ totalAmount: -1 });
    } else if (sort === 'departure-asc') {
      query = query.sort({ departureDate: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const bookings = await query.exec();

    const sanitizedBookings = bookings.map((b) => {
      const obj = b.toObject ? b.toObject() : b;
      obj.email = obj.email || obj.contactInfo?.email || obj.user?.email || 'guest@travelease.com';
      obj.customerName =
        obj.customerName ||
        obj.travelerDetails?.[0]?.name ||
        obj.user?.name ||
        (obj.email ? obj.email.split('@')[0] : 'Guest Traveler');
      obj.departureDate =
        obj.departureDate || obj.packageSnapshot?.departureDate || obj.createdAt || new Date();
      obj.packageTitleSnapshot =
        obj.packageTitleSnapshot || obj.packageSnapshot?.title || obj.package?.title || 'Tour Package';
      obj.destinationSnapshot =
        obj.destinationSnapshot || obj.packageSnapshot?.destinationName || obj.package?.destination || 'India';
      return obj;
    });

    res.json({
      success: true,
      count: sanitizedBookings.length,
      data: sanitizedBookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/bookings/:id
exports.getAdminBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('package')
      .populate('payment')
      .populate('user', 'name email phone createdAt');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
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

// GET /api/v1/admin/users
exports.getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Get booking counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const bookingCount = await Booking.countDocuments({
          $or: [{ user: u._id }, { email: u.email }],
        });
        return {
          ...u.toObject(),
          bookingCount,
        };
      })
    );

    res.json({
      success: true,
      count: usersWithCounts.length,
      data: usersWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/destinations
exports.getAdminDestinations = async (req, res, next) => {
  try {
    const destinations = await Destination.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: destinations.length,
      data: destinations,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/packages
exports.getAdminPackages = async (req, res, next) => {
  try {
    const packages = await TourPackage.find().populate('destination').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};
