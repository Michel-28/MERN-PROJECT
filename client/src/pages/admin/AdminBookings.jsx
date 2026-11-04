import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Calendar,
  IndianRupee,
  Users,
  Eye,
  Clock,
  Printer,
  CreditCard,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { getAdminBookings, cancelBooking } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [sort, setSort] = useState('date-desc');

  // Inspection modal
  const [inspectBooking, setInspectBooking] = useState(null);

  // Cancel target
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (status && status !== 'All') params.status = status;
      if (paymentStatus && paymentStatus !== 'All') params.paymentStatus = paymentStatus;
      if (sort) params.sort = sort;

      const res = await getAdminBookings(params);
      setBookings(res.data.data || []);
    } catch (err) {
      console.error('Error fetching admin bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status, paymentStatus, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      const res = await cancelBooking(cancelTarget._id, 'Administrative cancellation');
      toast.success(res.data?.message || `Booking ${cancelTarget.bookingReference} cancelled`);
      setCancelTarget(null);
      fetchBookings();
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  // Metrics calculation
  const totalVerifiedRevenue = bookings
    .filter((b) => b.status === 'Confirmed' && b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'Pending Payment' || b.paymentStatus === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin" className="hover:text-teal-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Admin Overview
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-bold">All Reservations</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Guest Bookings & Payment Auditing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer reservations, examine gateway transaction IDs, and inspect refunds.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-navy-900 bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100">
          <span>Verified Paid Value:</span>
          <span className="text-teal-700 text-sm">₹{totalVerifiedRevenue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Mini metric pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Records</span>
          <span className="text-xl font-black text-navy-900">{bookings.length}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid & Confirmed</span>
          <span className="text-xl font-black text-emerald-600">{confirmedCount}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Payment</span>
          <span className="text-xl font-black text-amber-600">{pendingCount}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Cancelled</span>
          <span className="text-xl font-black text-slate-600">{cancelledCount}</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-96 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ref, email, guest name, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:outline-none focus:border-teal-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto text-xs">
          
          {/* Status buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Booking:</span>
            {['All', 'Confirmed', 'Pending Payment', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  status === st
                    ? 'bg-navy-900 text-teal-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Payment Status */}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-navy-900 focus:border-teal-500"
          >
            <option value="All">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-navy-900 focus:border-teal-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="departure-asc">Departure Date</option>
          </select>

        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving booking records..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Ref Code</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Departure</th>
                  <th className="py-3.5 px-4">Travelers</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Booking Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      {b.bookingReference}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[150px]">
                      <div className="font-bold text-navy-900">
                        {b.customerName || (b.email ? b.email.split('@')[0] : 'Guest Traveler')}
                      </div>
                      <div className="text-[11px] text-slate-400">{b.email || 'N/A'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-navy-900 font-semibold truncate max-w-[180px]">
                      <div>{b.packageTitleSnapshot || b.package?.title || 'Tour Package'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {b.destinationSnapshot || b.package?.destination || 'India'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {b.departureDate
                        ? new Date(b.departureDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Date N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {b.travelerCount || 1} Person(s)
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-navy-900">
                      ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.paymentStatus === 'refunded'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.paymentStatus || 'pending'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectBooking(b)}
                          className="p-1.5 text-slate-500 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/booking-confirmation/${b._id}`}
                          target="_blank"
                          className="p-1.5 text-teal-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition"
                          title="View Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>

                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="py-1 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== BOOKING DETAILS INSPECTION MODAL ==================== */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider block">
                  Booking Inspection
                </span>
                <h3 className="text-xl font-black text-navy-900">
                  {inspectBooking.bookingReference}
                </h3>
              </div>
              <button
                onClick={() => setInspectBooking(null)}
                className="text-slate-400 hover:text-navy-900 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Close ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-navy-900 block uppercase text-[10px] tracking-wider text-slate-400">
                Customer Details
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Name:</span>
                  <span className="font-bold text-navy-900">{inspectBooking.customerName || inspectBooking.user?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email:</span>
                  <span className="font-bold text-navy-900">{inspectBooking.email || inspectBooking.user?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Phone:</span>
                  <span className="font-bold text-navy-900">{inspectBooking.contactPhone || inspectBooking.user?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Created At:</span>
                  <span className="font-bold text-navy-900">
                    {inspectBooking.createdAt ? new Date(inspectBooking.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Package & Itinerary Details */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-navy-900 block uppercase text-[10px] tracking-wider text-slate-400">
                Package Information
              </span>
              <div className="space-y-1">
                <div className="font-bold text-navy-900 text-sm">{inspectBooking.packageTitleSnapshot || inspectBooking.package?.title || 'Tour Package'}</div>
                <div className="text-slate-500">Destination: {inspectBooking.destinationSnapshot || inspectBooking.package?.destination || 'India'}</div>
                <div className="text-slate-500">
                  Departure: {inspectBooking.departureDate ? new Date(inspectBooking.departureDate).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-slate-500">Travelers: {inspectBooking.travelerCount || 1} Person(s)</div>
              </div>
            </div>

            {/* Payment Record & Transaction Audit */}
            <div className="space-y-2 p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-xs">
              <span className="font-bold text-teal-950 block uppercase text-[10px] tracking-wider">
                Payment Audit & Gateway References
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Status:</span>
                  <span className="font-bold text-teal-800 uppercase">{inspectBooking.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Amount:</span>
                  <span className="font-bold text-navy-900">₹{Number(inspectBooking.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Transaction ID:</span>
                  <span className="font-mono font-bold text-navy-900">{inspectBooking.paymentReference || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Method:</span>
                  <span className="font-bold text-navy-900">{inspectBooking.paymentMethod || 'Online'}</span>
                </div>
              </div>
            </div>

            {/* Cancellation and Refund */}
            {inspectBooking.cancellation && inspectBooking.cancellation.cancelledAt && (
              <div className="space-y-2 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-900">
                <span className="font-bold block uppercase text-[10px] tracking-wider text-rose-700">
                  Cancellation & Refund History
                </span>
                <div>Cancelled At: {new Date(inspectBooking.cancellation.cancelledAt).toLocaleString()}</div>
                <div>Reason: {inspectBooking.cancellation.reason}</div>
                <div>Refund Status: {inspectBooking.cancellation.refundStatus}</div>
                {inspectBooking.cancellation.refundAmount > 0 && (
                  <div>Refund Amount: ₹{inspectBooking.cancellation.refundAmount.toLocaleString('en-IN')}</div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                to={`/booking-confirmation/${inspectBooking._id}`}
                target="_blank"
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Open Receipt View</span>
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ==================== CANCEL DIALOG ==================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-navy-900">
                Cancel Booking {cancelTarget.bookingReference}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirm administrative cancellation of booking for guest{' '}
                <strong className="text-navy-900">
                  {cancelTarget.email || cancelTarget.customerName || cancelTarget.bookingReference}
                </strong>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Dismiss
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
      )}

    </div>
  );
}
