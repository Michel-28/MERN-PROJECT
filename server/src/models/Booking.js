const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourPackage',
      required: [true, 'Tour package reference is required'],
    },
    packageTitleSnapshot: {
      type: String,
      required: true,
    },
    destinationSnapshot: {
      type: String,
      required: true,
    },
    departureDate: {
      type: Date,
      required: [true, 'Departure date is required'],
    },
    travelerCount: {
      type: Number,
      required: [true, 'Traveler count is required'],
      min: [1, 'At least 1 traveler required'],
    },
    pricePerTraveler: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['Pending Payment', 'Confirmed', 'Cancelled', 'Payment Failed'],
      default: 'Pending Payment',
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded', 'refund_pending'],
      default: 'pending',
      index: true,
    },
    paymentReference: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay / Gateway',
    },
    specialRequests: {
      type: String,
      default: '',
    },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      reason: { type: String, default: '' },
      cancelledBy: { type: String, default: 'user' },
      refundStatus: { type: String, enum: ['none', 'pending', 'processed', 'ineligible'], default: 'none' },
      refundAmount: { type: Number, default: 0 },
      refundTransactionId: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
