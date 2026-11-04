import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Search,
  Filter,
  Calendar,
  Users,
  MapPin,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Printer,
  CreditCard,
  Clock,
  RefreshCw
} from 'lucide-react';
import { getBookings, cancelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const { user, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getBookings();
      setBookings(res.data.data || []);
    } catch (err) {
      console.error('Error fetching bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [isAuthenticated]);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      const res = await cancelBooking(cancelTarget._id, cancelReason);
      toast.success(res.data?.message || `Booking ${cancelTarget.bookingReference} has been cancelled`);
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  // Helper to compute refund estimate
  const getRefundEstimate = (depDateStr, totalAmount) => {
    const now = new Date();
    const dep = new Date(depDateStr);
    const diffDays = Math.ceil((dep - now) / (1000 * 60 * 60 * 24));
    let pct = 100;
    if (diffDays < 2) pct = 0;
    else if (diffDays <= 7) pct = 70;
    const est = Math.round((totalAmount * pct) / 100);
    return { pct, est, diffDays };
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      b.packageTitleSnapshot?.toLowerCase().includes(search.toLowerCase()) ||
      b.destinationSnapshot?.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'Confirmed') {
      matchesStatus = b.status === 'Confirmed';
    } else if (statusFilter === 'Pending') {
      matchesStatus = b.status === 'Pending Payment' || b.paymentStatus === 'pending';
    } else if (statusFilter === 'Cancelled') {
      matchesStatus = b.status === 'Cancelled';
    } else if (statusFilter === 'Failed') {
      matchesStatus = b.status === 'Payment Failed';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Tour Reservations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            My Tour Bookings & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Account: <strong className="text-navy-900">{user?.email}</strong>. Track verified reservations, download payment receipts, or initiate cancellations.
          </p>
        </div>

        <Link
          to="/packages"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition"
        >
          <span>Explore More Tours</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ref (e.g. TE-...) or package"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">
            Filter:
          </span>
          {[
            { id: 'All', label: 'All' },
            { id: 'Confirmed', label: 'Confirmed (Paid)' },
            { id: 'Pending', label: 'Pending Payment' },
            { id: 'Cancelled', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-full font-semibold transition ${
                statusFilter === st.id
                  ? 'bg-navy-900 text-teal-300 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <LoadingSpinner message="Loading your tour reservations..." />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings match your criteria"
          description="You haven't made any reservations under this filter."
          actionLabel="Browse Available Packages"
          onAction={() => window.location.assign('/packages')}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPaid = b.paymentStatus === 'paid';
            const isPending = b.status === 'Pending Payment' || b.paymentStatus === 'pending';
            const isCancelled = b.status === 'Cancelled';
            const isFailed = b.status === 'Payment Failed';

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Details */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-navy-900">
                      {b.bookingReference}
                    </span>

                    {/* Booking Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isCancelled
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : isPending ? (
                        <Clock className="w-3 h-3 text-amber-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-slate-500" />
                      )}
                      <span>{b.status}</span>
                    </span>

                    {/* Payment Status Pill */}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200/80 text-slate-600 font-medium">
                      Payment: <strong className={isPaid ? 'text-emerald-700' : 'text-amber-700'}>{b.paymentStatus || 'pending'}</strong>
                    </span>

                    <span className="text-[11px] text-slate-400">
                      Booked {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-900">
                    {b.packageTitleSnapshot}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      {b.destinationSnapshot}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      Departs: {new Date(b.departureDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      {b.travelerCount} Traveler(s)
                    </span>
                    {b.paymentReference && (
                      <span className="text-slate-400 text-[11px]">
                        Ref: <code className="font-mono text-slate-600">{b.paymentReference}</code>
                      </span>
                    )}
                  </div>

                  {b.cancellation?.refundAmount > 0 && (
                    <div className="text-[11px] text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 inline-block font-medium">
                      ✓ Refund of ₹{b.cancellation.refundAmount.toLocaleString('en-IN')} processed ({b.cancellation.refundStatus})
                    </div>
                  )}
                </div>

                {/* Right Price & Actions */}
                <div className="flex sm:flex-row md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Amount
                    </span>
                    <span className="text-lg font-extrabold text-navy-900">
                      ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View / Download Receipt */}
                    <Link
                      to={`/booking-confirmation/${b._id}`}
                      className="py-2 px-3.5 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isPaid ? 'Receipt' : 'Details'}</span>
                    </Link>

                    {/* If pending, option to complete payment */}
                    {isPending && (
                      <Link
                        to={`/packages/${b.package?.slug || b.package}/book`}
                        className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </Link>
                    )}

                    {/* Cancel Action if confirmed */}
                    {b.status === 'Confirmed' && (
                      <button
                        onClick={() => setCancelTarget(b)}
                        className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                      >
                        Cancel Tour
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CANCELLATION MODAL ==================== */}
      {cancelTarget && (() => {
        const refundInfo = getRefundEstimate(cancelTarget.departureDate, cancelTarget.totalAmount);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-5">
              
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-navy-900">
                  Cancel Booking {cancelTarget.bookingReference}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to cancel your reservation for{' '}
                  <strong className="text-navy-900">{cancelTarget.packageTitleSnapshot}</strong>?
                </p>
              </div>

              {/* Policy Refund Evaluation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Days until departure:</span>
                  <span className="font-bold text-navy-900">{refundInfo.diffDays} day(s)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Refund Policy:</span>
                  <span className="font-bold text-teal-700">{refundInfo.pct}% refundable</span>
                </div>
                <div className="flex justify-between font-bold text-navy-900 border-t border-slate-200 pt-1.5">
                  <span>Estimated Refund Amount:</span>
                  <span className="text-teal-700">₹{refundInfo.est.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cancellation Reason
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 bg-white"
                >
                  <option value="Change of travel plans">Change of travel plans</option>
                  <option value="Found an alternative date">Found an alternative date</option>
                  <option value="Personal emergency">Personal emergency</option>
                  <option value="Academic test / demonstration">Academic review / demonstration</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
