const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'test_gateway'],
      default: 'razorpay',
    },
    gatewayOrderId: {
      type: String,
      required: [true, 'Gateway order ID is required'],
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      index: true,
      default: null,
    },
    gatewaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded', 'refund_pending'],
      default: 'created',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'Card / NetBanking / UPI',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    refund: {
      refundId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      status: { type: String, enum: ['none', 'refund_pending', 'refunded'], default: 'none' },
      refundedAt: { type: Date, default: null },
      reason: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
