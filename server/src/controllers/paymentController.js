const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const TourPackage = require('../models/TourPackage');

// Initialize Razorpay client helper
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (
    key_id &&
    key_secret &&
    !key_id.includes('placeholder') &&
    !key_secret.includes('placeholder')
  ) {
    return new Razorpay({ key_id, key_secret });
  }
  return null;
};

// Check if running in mock/demo fallback mode
const isMockGatewayMode = () => {
  const instance = getRazorpayInstance();
  return !instance;
};

// @desc    Create a payment order (Razorpay or Test Mode)
// @route   POST /api/v1/payments/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required to initiate payment order',
      });
    }

    const booking = await Booking.findById(bookingId).populate('package');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Authorization check: user must own booking or be admin
    const isOwner =
      (booking.user && booking.user.toString() === req.user._id.toString()) ||
      booking.email.toLowerCase() === req.user.email.toLowerCase() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to pay for this booking',
      });
    }

    if (booking.status === 'Confirmed' && booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already paid and confirmed',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has been cancelled and cannot be paid',
      });
    }

    // Trusted server-side calculation verification
    const verifiedAmount = booking.totalAmount;
    const amountInPaise = Math.round(verifiedAmount * 100);

    const rzp = getRazorpayInstance();
    let orderId;
    let provider = 'razorpay';
    const isMock = isMockGatewayMode();

    if (rzp) {
      // Live / Test Mode Razorpay Gateway
      try {
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: booking.bookingReference,
          notes: {
            bookingId: booking._id.toString(),
            package: booking.packageTitleSnapshot,
            userEmail: booking.email,
          },
        });
        orderId = rzpOrder.id;
      } catch (err) {
        console.error('[Razorpay Order Creation Error]:', err);
        return res.status(502).json({
          success: false,
          message: 'Failed to initiate order with Razorpay gateway. Check test credentials.',
          error: err.message,
        });
      }
    } else {
      // Academic Test / Mock Mode Fallback
      provider = 'test_gateway';
      orderId = `order_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    // Create or update Payment attempt record
    let payment = await Payment.findOne({
      booking: booking._id,
      status: 'created',
    });

    if (payment) {
      payment.gatewayOrderId = orderId;
      payment.amount = verifiedAmount;
      payment.provider = provider;
      await payment.save();
    } else {
      payment = await Payment.create({
        booking: booking._id,
        user: req.user._id,
        provider,
        gatewayOrderId: orderId,
        amount: verifiedAmount,
        currency: 'INR',
        status: 'created',
      });
    }

    // Attach payment ref to booking
    booking.payment = payment._id;
    booking.paymentStatus = 'created';
    await booking.save();

    res.json({
      success: true,
      orderId,
      amount: verifiedAmount,
      amountInPaise,
      currency: 'INR',
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_academic_mode',
      isMockMode: isMock,
      provider,
      packageTitle: booking.packageTitleSnapshot,
      customerName: booking.customerName || req.user.name,
      customerEmail: booking.email,
      customerPhone: booking.contactPhone || req.user.phone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment signature and confirm booking
// @route   POST /api/v1/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      orderId,
      paymentId,
      signature,
      paymentMethod = 'Online Gateway',
    } = req.body;

    if (!bookingId || !orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, orderId, and paymentId are required for verification',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Authorization
    const isOwner =
      (booking.user && booking.user.toString() === req.user._id.toString()) ||
      booking.email.toLowerCase() === req.user.email.toLowerCase() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot verify payment for this booking',
      });
    }

    // Idempotency check: if already confirmed and paid with same reference
    if (booking.status === 'Confirmed' && booking.paymentStatus === 'paid') {
      const existingPayment = await Payment.findOne({ booking: booking._id, status: 'paid' });
      return res.json({
        success: true,
        message: 'Payment already verified and confirmed',
        booking,
        payment: existingPayment,
      });
    }

    const rzp = getRazorpayInstance();
    const isMock = isMockGatewayMode();

    if (rzp) {
      // Official cryptographic verification for Razorpay
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay payment signature is required for live/test verification',
        });
      }

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${orderId}|${paymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== signature) {
        // Payment signature mismatch
        await Payment.findOneAndUpdate(
          { booking: booking._id },
          {
            status: 'failed',
            errorMessage: 'Cryptographic signature mismatch during gateway verification',
          }
        );
        booking.status = 'Payment Failed';
        booking.paymentStatus = 'failed';
        await booking.save();

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Invalid payment signature',
        });
      }
    } else {
      // Academic Test Mode / Mock Mode verification
      // Requires realistic test paymentId pattern
      if (!paymentId.startsWith('pay_')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid test payment transaction identifier',
        });
      }
    }

    // Successful Verification: Update Payment record
    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        gatewaySignature: signature || 'test_signature_verified',
        status: 'paid',
        paymentMethod,
        verifiedAt: new Date(),
        errorMessage: null,
      },
      { new: true, upsert: true }
    );

    // Update Booking status to Confirmed and Paid
    booking.status = 'Confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentReference = paymentId;
    booking.paymentMethod = paymentMethod;
    booking.payment = payment._id;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment verified successfully! Your tour reservation is confirmed.',
      booking,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle payment failure or cancellation
// @route   POST /api/v1/payments/failure
// @access  Private
exports.handlePaymentFailure = async (req, res, next) => {
  try {
    const { bookingId, orderId, errorReason = 'Payment was declined or cancelled by user' } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Update Payment
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        status: 'failed',
        errorMessage: errorReason,
      }
    );

    // Update Booking
    booking.status = 'Payment Failed';
    booking.paymentStatus = 'failed';
    await booking.save();

    res.json({
      success: true,
      message: 'Payment marked as failed',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed receipt for a paid booking
// @route   GET /api/v1/payments/receipt/:bookingId
// @access  Private
exports.getReceipt = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('package')
      .populate('payment')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking receipt not found',
      });
    }

    // Access control
    const isOwner =
      (booking.user && booking.user._id.toString() === req.user._id.toString()) ||
      booking.email.toLowerCase() === req.user.email.toLowerCase() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this receipt',
      });
    }

    const payment = booking.payment || (await Payment.findOne({ booking: booking._id }));

    // Price details
    const pricePerTraveler = booking.pricePerTraveler;
    const travelerCount = booking.travelerCount;
    const baseAmount = pricePerTraveler * travelerCount;
    const taxesAndCharges = 0; // Inclusive in TravelEase rates
    const totalAmount = booking.totalAmount;

    const receipt = {
      receiptNumber: `REC-${booking.bookingReference}`,
      bookingReference: booking.bookingReference,
      bookingId: booking._id,
      customer: {
        name: booking.customerName || booking.user?.name || booking.email.split('@')[0],
        email: booking.email,
        phone: booking.contactPhone || booking.user?.phone || 'N/A',
      },
      package: {
        title: booking.packageTitleSnapshot,
        destination: booking.destinationSnapshot,
        durationDays: booking.package?.durationDays || 4,
        durationNights: booking.package?.durationNights || 3,
      },
      departureDate: booking.departureDate,
      travelerCount,
      priceBreakdown: {
        pricePerTraveler,
        baseAmount,
        taxesAndCharges,
        totalPaid: totalAmount,
        currency: booking.currency || 'INR',
      },
      payment: {
        status: booking.paymentStatus,
        isPaid: booking.paymentStatus === 'paid',
        provider: payment?.provider || 'Razorpay / Gateway',
        transactionId: booking.paymentReference || payment?.gatewayPaymentId || 'N/A',
        orderId: payment?.gatewayOrderId || 'N/A',
        paymentMethod: payment?.paymentMethod || booking.paymentMethod || 'Online',
        paidAt: payment?.verifiedAt || booking.updatedAt,
      },
      cancellationPolicy:
        'Free cancellation up to 7 days before departure date. Cancellations made 3-7 days prior receive a 70% refund. Cancellations made within 48 hours are non-refundable.',
      issuedAt: new Date(),
    };

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};
