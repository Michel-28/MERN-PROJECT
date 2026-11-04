import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MapPin,
  Clock,
  ArrowLeft,
  CreditCard,
  Lock,
  Phone,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
  Wallet,
  Smartphone
} from 'lucide-react';
import {
  getPackage,
  createBooking,
  getPackageAvailability,
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailure,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function BookingFlow() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [departureDate, setDepartureDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [availability, setAvailability] = useState(null);

  // Payment Gateway Modal State
  const [activePaymentModal, setActivePaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentFailedNotice, setPaymentFailedNotice] = useState(null);

  // Load Tour Package
  useEffect(() => {
    const loadPkg = async () => {
      try {
        setLoading(true);
        const res = await getPackage(slug);
        const data = res.data.data;
        setPkg(data);
        if (data.departureDates && data.departureDates.length > 0) {
          setDepartureDate(data.departureDates[0]);
        }
      } catch (err) {
        console.error('Error fetching package', err);
        toast.error('Tour package not found');
      } finally {
        setLoading(false);
      }
    };
    loadPkg();
  }, [slug]);

  // Load Availability when date changes
  useEffect(() => {
    if (pkg?._id && departureDate) {
      getPackageAvailability(pkg._id, departureDate)
        .then((res) => setAvailability(res.data))
        .catch(() => setAvailability(null));
    }
  }, [pkg?._id, departureDate]);

  // Handle Form Submission -> Initiates Booking & Payment Order
  const handleProceedToPayment = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in or register to complete your reservation');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!departureDate) {
      toast.error('Please choose an eligible departure date');
      return;
    }

    try {
      setSubmitting(true);
      setPaymentFailedNotice(null);

      // Step 1: Create pending reservation on backend
      const bookingRes = await createBooking({
        packageId: pkg._id,
        departureDate,
        travelerCount: travelers,
        contactPhone,
        specialRequests,
        customerName: user.name,
      });

      const booking = bookingRes.data.data;
      setPendingBookingId(booking._id);

      // Step 2: Create Gateway Payment Order on backend
      const orderRes = await createPaymentOrder({ bookingId: booking._id });
      const orderData = orderRes.data;
      setCurrentOrder(orderData);

      // Step 3: Check if official Razorpay checkout script can be invoked
      if (
        window.Razorpay &&
        orderData.keyId &&
        !orderData.keyId.includes('placeholder') &&
        !orderData.isMockMode
      ) {
        // Live/Test Razorpay Checkout
        const rzpOptions = {
          key: orderData.keyId,
          amount: orderData.amountInPaise,
          currency: orderData.currency,
          name: 'TravelEase Tours',
          description: orderData.packageTitle,
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              toast.loading('Verifying payment signature with backend...');
              const verifyRes = await verifyPayment({
                bookingId: booking._id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                paymentMethod: 'Razorpay Gateway',
              });

              toast.dismiss();
              toast.success('Payment verified! Booking confirmed.');
              navigate(`/booking-confirmation/${verifyRes.data.booking._id}`);
            } catch (err) {
              toast.dismiss();
              toast.error(err.response?.data?.message || 'Payment signature verification failed');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: contactPhone || user.phone,
          },
          theme: {
            color: '#0d9488',
          },
          modal: {
            ondismiss: async () => {
              toast('Payment session dismissed. Booking remains pending.', { icon: 'ℹ️' });
              setPaymentFailedNotice({
                reason: 'Checkout window was closed before completion.',
                canRetry: true,
              });
            },
          },
        };

        const rzpInstance = new window.Razorpay(rzpOptions);
        rzpInstance.open();
      } else {
        // Academic Test Mode / Fallback Simulation Modal
        setActivePaymentModal(true);
      }
    } catch (err) {
      console.error('Booking initiation failed', err);
      const msg = err.response?.data?.message || 'Failed to initiate booking order';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate Payment Success (Test Gateway Verification)
  const handleSimulatePaymentSuccess = async () => {
    if (!currentOrder || !pendingBookingId) return;

    try {
      setPaymentProcessing(true);
      const testPaymentId = `pay_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const res = await verifyPayment({
        bookingId: pendingBookingId,
        orderId: currentOrder.orderId,
        paymentId: testPaymentId,
        signature: 'test_verified_hmac_sha256_academic_demo',
        paymentMethod: selectedMethod,
      });

      toast.success('Payment verified by server! Booking confirmed.');
      setActivePaymentModal(false);
      navigate(`/booking-confirmation/${res.data.booking._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      toast.error(msg);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Simulate Payment Failure
  const handleSimulatePaymentFailure = async () => {
    if (!currentOrder || !pendingBookingId) return;

    try {
      setPaymentProcessing(true);
      await reportPaymentFailure({
        bookingId: pendingBookingId,
        orderId: currentOrder.orderId,
        errorReason: 'Customer card or account was declined by gateway test simulation',
      });

      toast.error('Payment declined by gateway');
      setActivePaymentModal(false);
      setPaymentFailedNotice({
        reason: 'Transaction was declined by bank or test gateway. You can retry with another method.',
        canRetry: true,
      });
    } catch (err) {
      toast.error('Error reporting failure');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Dismiss / Cancel Checkout
  const handleClosePaymentModal = () => {
    setActivePaymentModal(false);
    setPaymentFailedNotice({
      reason: 'Payment process was interrupted. You can retry payment whenever ready.',
      canRetry: true,
    });
  };

  if (loading) return <LoadingSpinner message="Loading checkout details..." />;
  if (!pkg) return null;

  const price = pkg.pricePerTraveler || 0;
  const totalPrice = price * travelers;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fadeIn">
      {/* Back button */}
      <Link
        to={`/packages/${pkg.slug || pkg._id}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Package Details
      </Link>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Review & Secure Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review tour details, specify traveler count, and proceed to payment verification.
        </p>
      </div>

      {/* Payment Failure / Retry Notice */}
      {paymentFailedNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Payment Pending or Failed</span>
              <span className="text-[11px] text-amber-800">{paymentFailedNotice.reason}</span>
            </div>
          </div>
          {paymentFailedNotice.canRetry && (
            <button
              onClick={() => setActivePaymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Payment</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Form: Traveler selection & Contact */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleProceedToPayment} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Identity Banner */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                  Authenticated Traveler
                </span>
                <span className="text-xs font-bold text-navy-900">
                  {user ? `${user.name} (${user.email})` : 'Guest Session'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/70 px-2.5 py-1 rounded-full w-fit">
                Role: {user?.role || 'user'}
              </span>
            </div>

            {/* Date selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Departure Date
              </label>
              <select
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-navy-900 bg-white focus:border-teal-500 focus:outline-none"
                required
              >
                {pkg.departureDates?.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </option>
                ))}
              </select>

              {availability && (
                <p className="text-[11px] text-teal-700 font-medium mt-2">
                  ✓ {availability.availableSpots} of {availability.capacity} spots currently available for this departure.
                </p>
              )}
            </div>

            {/* Traveler Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Number of Travelers
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  className="w-11 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-lg text-navy-900 flex items-center justify-center transition"
                >
                  -
                </button>
                <div className="flex-1 py-2.5 rounded-xl border border-slate-200 text-center font-bold text-sm text-navy-900 bg-slate-50">
                  {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const maxLimit = availability?.availableSpots || 20;
                    if (travelers < maxLimit) setTravelers(travelers + 1);
                    else toast.error(`Maximum available spots: ${maxLimit}`);
                  }}
                  className="w-11 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-lg text-navy-900 flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Contact Phone for Reservation SMS / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Special Requests or Dietary Preferences (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Vegetarian meals preferred, quiet room request..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Cancellation Policy Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
              <span className="font-bold text-navy-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Cancellation & Refund Terms
              </span>
              <p>
                • Free cancellation and 100% refund up to 7 days prior to departure.
              </p>
              <p>
                • 70% refund for cancellations between 3 to 7 days before departure.
              </p>
              <p>
                • Non-refundable within 48 hours of departure date.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Initiating Payment...' : 'Proceed to Secure Payment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Summary Card */}
        <div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5 sticky top-24">
            <h3 className="font-bold text-sm text-navy-900 border-b border-slate-100 pb-3">
              Booking Breakdown
            </h3>

            {pkg.images && pkg.images.length > 0 && (
              <img
                src={pkg.images[0]}
                alt={pkg.title}
                className="w-full h-36 object-cover rounded-2xl shadow-sm"
              />
            )}

            <div className="space-y-2">
              <h4 className="font-extrabold text-base text-navy-900 leading-snug">
                {pkg.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{pkg.destination?.name || 'Top Destination'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{pkg.durationDays} Days / {pkg.durationNights || pkg.durationDays - 1} Nights</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Base rate per traveler</span>
                <span className="font-semibold text-navy-900">₹{Number(price).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Traveler count</span>
                <span className="font-semibold text-navy-900">× {travelers}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Goods & Services Tax (GST)</span>
                <span className="text-teal-600 font-semibold">Included in rate</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between font-extrabold text-navy-900 text-sm">
                <span>Total Payable Amount</span>
                <span className="text-teal-700 text-base">₹{Number(totalPrice).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-navy-900 block flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                Verified Payment Gateway
              </span>
              <span>Encrypted server-side signature verification. Powered by Razorpay in Test Mode.</span>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== ACADEMIC PAYMENT GATEWAY SIMULATION MODAL ==================== */}
      {activePaymentModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[10px] uppercase">
                  <span>Razorpay Test Gateway Mode</span>
                </div>
                <h3 className="text-lg font-extrabold text-navy-900">
                  Complete Payment Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Order ID: <code className="font-mono font-bold text-navy-900">{currentOrder.orderId}</code>
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="p-1 rounded-xl text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Order Amount Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-navy-900 to-navy-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-white">
                  ₹{Number(currentOrder.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right text-xs text-slate-300">
                <span className="block font-semibold">{currentOrder.packageTitle}</span>
                <span className="text-[11px] text-slate-400">{travelers} Traveler(s)</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                  { id: 'NetBanking', label: 'NetBanking', icon: Wallet },
                  { id: 'Card', label: 'Card Payment', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center gap-1.5 transition ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulation Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={handleSimulatePaymentSuccess}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{paymentProcessing ? 'Verifying with Server...' : 'Simulate Successful Payment'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={handleSimulatePaymentFailure}
                  className="py-2.5 px-3 rounded-xl font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Simulate Failure</span>
                </button>

                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={handleClosePaymentModal}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel Checkout
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 leading-tight">
              Test mode verified with HMAC SHA256 cryptographic signature validation on Express server.
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
