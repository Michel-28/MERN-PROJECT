import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Clock,
  Printer,
  ArrowRight,
  ShieldCheck,
  Package,
  CreditCard,
  Download,
  AlertCircle,
  Compass
} from 'lucide-react';
import { getBooking, getReceipt } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBooking(bookingId),
      getReceipt(bookingId).catch(() => null),
    ])
      .then(([bookingRes, receiptRes]) => {
        setBooking(bookingRes.data.data);
        if (receiptRes?.data?.data) {
          setReceiptData(receiptRes.data.data);
        }
      })
      .catch((err) => {
        console.error('Error loading booking confirmation', err);
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <LoadingSpinner message="Retrieving booking and payment verification record..." />;

  if (!booking) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-navy-900 mb-2">Booking Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested booking reference could not be located or you are not authorized to view it.
        </p>
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700"
        >
          Go to My Bookings
        </Link>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === 'paid';
  const isPending = booking.status === 'Pending Payment' || booking.paymentStatus === 'pending';
  const isFailed = booking.status === 'Payment Failed' || booking.paymentStatus === 'failed';
  const isCancelled = booking.status === 'Cancelled';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fadeIn">
      
      {/* Top Status Header */}
      <div className="text-center space-y-3">
        {isPaid ? (
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : isPending ? (
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Clock className="w-10 h-10" />
          </div>
        ) : isCancelled ? (
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          {isPaid
            ? 'Booking & Payment Confirmed!'
            : isPending
            ? 'Booking Pending Payment'
            : isCancelled
            ? 'Booking Cancelled'
            : 'Payment Not Confirmed'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {isPaid
            ? 'Your payment was cryptographically verified. A formal booking receipt has been generated.'
            : isPending
            ? 'Your tour reservation has been created but payment is pending verification.'
            : isCancelled
            ? 'This booking was cancelled and is no longer active.'
            : 'Payment attempt was declined or failed. You may retry payment from My Bookings.'}
        </p>
      </div>

      {/* Main Printable Receipt Card */}
      <div
        id="printable-receipt"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:border-none print:shadow-none print:p-0"
      >
        
        {/* Receipt Header Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest block">
                TravelEase Official Booking Receipt
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-wider text-white">
                {booking.bookingReference}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                isPaid
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                  : isPending
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                  : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPaid ? 'bg-emerald-400 animate-pulse' : isPending ? 'bg-amber-400' : 'bg-rose-400'
                }`}
              />
              <span>{isPaid ? 'PAID & CONFIRMED' : booking.status}</span>
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-xs">
          
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Receipt Number
              </span>
              <span className="font-bold text-navy-900 text-xs font-mono">
                REC-{booking.bookingReference}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Payment Date
              </span>
              <span className="font-bold text-navy-900 text-xs">
                {new Date(booking.updatedAt || booking.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Payment Method
              </span>
              <span className="font-bold text-navy-900 text-xs">
                {booking.paymentMethod || 'Razorpay / Gateway'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Transaction Ref
              </span>
              <span className="font-bold text-teal-700 text-xs font-mono truncate block" title={booking.paymentReference || 'N/A'}>
                {booking.paymentReference || 'Pending verification'}
              </span>
            </div>
          </div>

          {/* Customer & Package Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Customer Information
              </span>
              <div className="font-bold text-navy-900 text-sm">
                {booking.customerName || booking.email.split('@')[0]}
              </div>
              <div className="text-slate-500 font-medium">Email: {booking.email}</div>
              {booking.contactPhone && (
                <div className="text-slate-500 font-medium">Phone: {booking.contactPhone}</div>
              )}
            </div>

            {/* Tour Package Details */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Tour Package Details
              </span>
              <div className="font-bold text-navy-900 text-sm">
                {booking.packageTitleSnapshot}
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Destination: {booking.destinationSnapshot}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Departs:{' '}
                  {new Date(booking.departureDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Price Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Travelers</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3 px-4 font-semibold text-navy-900">
                    {booking.packageTitleSnapshot}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">
                    {booking.travelerCount} Person(s)
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    ₹{Number(booking.pricePerTraveler).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-navy-900">
                    ₹{Number(booking.pricePerTraveler * booking.travelerCount).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-500" colSpan={3}>
                    Applicable Taxes (GST 5% - Included)
                  </td>
                  <td className="py-2.5 px-4 text-right text-teal-600 font-semibold">
                    ₹0 (Included)
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/70 border-t border-slate-200 font-extrabold text-navy-900 text-sm">
                <tr>
                  <td className="py-3.5 px-4 text-left" colSpan={3}>
                    Total Amount {isPaid ? 'Paid' : 'Due'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-teal-700 text-base">
                    ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cancellation Policy and Legal terms */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-teal-950 block">Cancellation & Refund Notice</span>
            <p>
              Free cancellation with 100% refund up to 7 days prior to departure. 70% refund for cancellations made 3 to 7 days before departure. This document is a formal transaction receipt issued by TravelEase.
            </p>
          </div>

        </div>

      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-navy-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 transition"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Download / Print Receipt</span>
        </button>

        <Link
          to="/my-bookings"
          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md flex items-center justify-center gap-2 transition"
        >
          <span>View In My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
