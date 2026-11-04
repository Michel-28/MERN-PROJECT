import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Package,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ArrowRight,
  Plus,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getAdminStats } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Error fetching admin stats', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading administrative dashboard..." />;

  const stats = data?.stats || {};
  const recentBookings = data?.recentBookings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      
      {/* Top Demo Admin Notice Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            TravelEase Management Portal
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Role-verified admin environment: manage destinations, configure tour packages, inspect customer payments, monitor refunds, and audit system metrics.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/destinations/new"
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Destination</span>
          </Link>
          <Link
            to="/admin/packages/new"
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs text-navy-900 bg-white hover:bg-slate-100 shadow-md transition"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            <span>New Package</span>
          </Link>
        </div>
      </div>

      {/* Nav Tabs to Sub-Admin Sections */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <Link
          to="/admin"
          className="px-4 py-2 rounded-xl bg-navy-900 text-teal-300 shadow-sm"
        >
          Overview & Metrics
        </Link>
        <Link
          to="/admin/bookings"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          Manage Bookings ({stats.totalBookings || 0})
        </Link>
        <Link
          to="/admin/users"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          Registered Users ({stats.totalUsers || 0})
        </Link>
        <Link
          to="/admin/destinations"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          Destinations ({stats.totalDestinations || 0})
        </Link>
        <Link
          to="/admin/packages"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          Tour Packages ({stats.totalPackages || 0})
        </Link>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Verified Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Verified Gateway Revenue
            </span>
            <div className="text-2xl sm:text-3xl font-black text-navy-900 mt-1">
              ₹{Number(stats.totalDemoBookingValue || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1.5 block">
              ✓ Paid & confirmed only
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Reservations
            </span>
            <div className="text-3xl font-black text-navy-900 mt-1">
              {stats.totalBookings || 0}
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-1.5 block">
              <strong className="text-emerald-600">{stats.confirmedBookings || 0}</strong> paid •{' '}
              <strong className="text-amber-600">{stats.pendingPaymentBookings || 0}</strong> pending
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Users */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Registered Users
            </span>
            <div className="text-3xl font-black text-navy-900 mt-1">
              {stats.totalUsers || 0}
            </div>
            <Link to="/admin/users" className="text-[11px] font-semibold text-teal-600 hover:underline mt-1.5 inline-block">
              View user accounts &rarr;
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Packages & Destinations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Active Inventory
            </span>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {stats.totalPackages || 0} Packages
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              Across {stats.totalDestinations || 0} destinations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Breakdown & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Recent Customer Bookings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time reservations and payment statuses recorded in MongoDB</p>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
            >
              View all bookings &rarr;
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No bookings made yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Ref</th>
                    <th className="py-3 px-2">Guest</th>
                    <th className="py-3 px-2">Package</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2">Payment</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-2 font-mono font-bold text-navy-900">
                        {b.bookingReference}
                      </td>
                      <td className="py-3 px-2 text-slate-600 truncate max-w-[120px]">
                        {b.customerName || b.email || 'Guest'}
                      </td>
                      <td className="py-3 px-2 text-navy-900 font-semibold truncate max-w-[160px]">
                        {b.packageTitleSnapshot || b.package?.title || 'Tour Package'}
                      </td>
                      <td className="py-3 px-2 font-bold text-navy-900">
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {b.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Status Visualization & Security Check */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Reservation Pipeline
            </h3>

            {/* Visual ratio bar */}
            <div className="space-y-3 pt-2">
              <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="bg-teal-600 h-full transition-all duration-500"
                  style={{
                    width: `${stats.totalBookings > 0 ? ((stats.confirmedBookings || 0) / stats.totalBookings) * 100 : 100}%`,
                  }}
                  title="Confirmed (Paid)"
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{
                    width: `${stats.totalBookings > 0 ? ((stats.pendingPaymentBookings || 0) / stats.totalBookings) * 100 : 0}%`,
                  }}
                  title="Pending Payment"
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{
                    width: `${stats.totalBookings > 0 ? ((stats.cancelledBookings || 0) / stats.totalBookings) * 100 : 0}%`,
                  }}
                  title="Cancelled"
                />
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span className="text-slate-600">Confirmed (Paid):</span>
                  </div>
                  <strong className="text-navy-900">{stats.confirmedBookings || 0}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600">Pending Payment:</span>
                  </div>
                  <strong className="text-navy-900">{stats.pendingPaymentBookings || 0}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Cancelled / Refunded:</span>
                  </div>
                  <strong className="text-navy-900">{stats.cancelledBookings || 0}</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
              <p className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>JWT Authentication & RBAC Active</span>
              </p>
              <p className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Razorpay HMAC SHA256 Signature Verification</span>
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
