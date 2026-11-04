import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Star,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  CalendarCheck,
  Lock,
} from 'lucide-react';
import { getPackage, getPackageAvailability, createBooking } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function PackageDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openLoginModal } = useDemoUser();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking Form State
  const [departureDate, setDepartureDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [expandedDay, setExpandedDay] = useState(1);

  useEffect(() => {
    const fetchPackage = async () => {
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
    fetchPackage();
  }, [slug]);

  // Check live availability whenever departure date changes
  useEffect(() => {
    if (pkg?._id && departureDate) {
      setCheckingAvailability(true);
      getPackageAvailability(pkg._id, departureDate)
        .then((res) => {
          setAvailability(res.data);
        })
        .catch(() => {
          setAvailability(null);
        })
        .finally(() => {
          setCheckingAvailability(false);
        });
    }
  }, [pkg?._id, departureDate]);

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    if (!departureDate) {
      toast.error('Please select an available departure date');
      return;
    }

    if (availability && travelers > availability.availableSpots) {
      toast.error(`Only ${availability.availableSpots} spot(s) remaining for this departure date!`);
      return;
    }

    // Direct to dedicated review and checkout page
    navigate(`/packages/${pkg.slug || pkg._id}/book`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading tour package details..." />;
  }

  if (!pkg) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-navy-900 mb-2">Package Not Found</h2>
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600"
        >
          Browse All Packages
        </Link>
      </div>
    );
  }

  const destinationName = pkg.destination?.name || 'Top Destination';
  const price = pkg.pricePerTraveler || 0;
  const totalPrice = price * travelers;
  const images = pkg.images && pkg.images.length > 0
    ? pkg.images
    : ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/" className="hover:text-teal-600">Home</Link>
        <span>/</span>
        <Link to="/packages" className="hover:text-teal-600">Packages</Link>
        <span>/</span>
        <span className="text-navy-900 font-semibold">{pkg.title}</span>
      </div>

      {/* Title & Badges Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              <MapPin className="w-3.5 h-3.5" />
              {destinationName}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{pkg.averageRating || '4.8'}</span>
              <span className="text-slate-400 font-normal">({pkg.reviewCount || 24} reviews)</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-navy-900 tracking-tight">
            {pkg.title}
          </h1>
        </div>

        {/* Duration badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-navy-900 font-bold text-xs">
          <Clock className="w-4 h-4 text-teal-600" />
          <span>{pkg.durationDays} Days / {pkg.durationNights || pkg.durationDays - 1} Nights</span>
        </div>
      </div>

      {/* Main Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[340px] sm:h-[420px] rounded-3xl overflow-hidden shadow-lg">
        <div className="md:col-span-2 h-full bg-slate-100 overflow-hidden">
          <img
            src={images[0]}
            alt={pkg.title}
            className="w-full h-full object-cover hover:scale-102 transition duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>
        <div className="hidden md:flex flex-col gap-4 h-full">
          <div className="flex-1 bg-slate-100 overflow-hidden">
            <img
              src={images[1] || images[0]}
              alt=""
              className="w-full h-full object-cover hover:scale-102 transition duration-500"
            />
          </div>
          <div className="flex-1 bg-slate-100 overflow-hidden">
            <img
              src={images[2] || images[0]}
              alt=""
              className="w-full h-full object-cover hover:scale-102 transition duration-500"
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column (2 Cols): Details, Itinerary, Inclusions/Exclusions */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Overview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-navy-900 mb-3">Package Overview</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {pkg.description}
            </p>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Inclusions */}
            <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 shadow-sm">
              <h3 className="text-base font-bold text-emerald-950 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                What's Included
              </h3>
              <ul className="space-y-2.5 text-xs text-emerald-900 font-medium">
                {pkg.inclusions && pkg.inclusions.length > 0 ? (
                  pkg.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{inc}</span>
                    </li>
                  ))
                ) : (
                  <li>Accommodation, daily breakfast, and sightseeing transfers.</li>
                )}
              </ul>
            </div>

            {/* Exclusions */}
            <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 shadow-sm">
              <h3 className="text-base font-bold text-rose-950 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                What's Excluded
              </h3>
              <ul className="space-y-2.5 text-xs text-rose-900 font-medium">
                {pkg.exclusions && pkg.exclusions.length > 0 ? (
                  pkg.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{exc}</span>
                    </li>
                  ))
                ) : (
                  <li>Airfare, personal expenses, and optional adventure fees.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Day-by-day Itinerary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-navy-900 mb-2">Day-by-Day Itinerary</h2>
            <p className="text-xs text-slate-500 mb-6">
              Complete schedule designed by travel specialists for maximum enjoyment.
            </p>

            <div className="space-y-3">
              {pkg.itinerary && pkg.itinerary.length > 0 ? (
                pkg.itinerary.map((dayItem) => {
                  const isOpen = expandedDay === dayItem.day;
                  return (
                    <div
                      key={dayItem.day}
                      className="rounded-2xl border border-slate-200 overflow-hidden transition"
                    >
                      <button
                        onClick={() => setExpandedDay(isOpen ? null : dayItem.day)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100 text-left transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            D{dayItem.day}
                          </span>
                          <span className="font-bold text-sm text-navy-900">
                            {dayItem.title}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-5 text-xs text-slate-600 bg-white space-y-3 border-t border-slate-100 animate-fadeIn">
                          <p className="leading-relaxed">{dayItem.description}</p>
                          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                            <span>🍽️ {dayItem.meals || 'Breakfast included'}</span>
                            <span>🏨 {dayItem.accommodation || 'Deluxe Hotel'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">Custom daily schedule provided upon booking.</p>
              )}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-navy-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Demo Booking & Cancellation Policy
            </h4>
            <p>
              Free cancellation is supported through the "My Bookings" dashboard at any time during this demonstration. No real charges or penalties apply.
            </p>
          </div>

        </div>

        {/* Right Column: Live Booking Form Sidebar */}
        <div>
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl sticky top-24 space-y-6">
            
            {/* Price Header */}
            <div className="border-b border-slate-100 pb-5">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Starting from
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-navy-900">
                  ₹{Number(price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ person</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-5 text-xs">
              
              {/* Departure Date Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Departure Date</span>
                  {checkingAvailability && (
                    <span className="text-teal-600 font-normal">Checking spots...</span>
                  )}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-medium text-navy-900 focus:border-teal-500 bg-white"
                    required
                  >
                    {pkg.departureDates && pkg.departureDates.length > 0 ? (
                      pkg.departureDates.map((date) => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </option>
                      ))
                    ) : (
                      <option value="2026-11-15">Nov 15, 2026</option>
                    )}
                  </select>
                </div>

                {/* Live Capacity Info */}
                {availability && (
                  <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Available Capacity:</span>
                    <span
                      className={`font-bold ${
                        availability.availableSpots <= 3 ? 'text-rose-600' : 'text-teal-700'
                      }`}
                    >
                      {availability.availableSpots} / {availability.capacity} spots left
                    </span>
                  </div>
                )}
              </div>

              {/* Number of Travelers */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Number of Travelers
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-base text-navy-900 flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <div className="flex-1 py-2 rounded-xl border border-slate-200 text-center font-bold text-sm text-navy-900 bg-slate-50">
                    {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const maxLimit = availability ? availability.availableSpots : 20;
                      if (travelers < maxLimit) {
                        setTravelers(travelers + 1);
                      } else {
                        toast.error(`Only ${maxLimit} spots available`);
                      }
                    }}
                    className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-base text-navy-900 flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>₹{Number(price).toLocaleString('en-IN')} × {travelers} traveler(s)</span>
                  <span className="font-medium text-navy-900">
                    ₹{Number(totalPrice).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Taxes & Service Fees</span>
                  <span className="text-teal-600 font-semibold">Included</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-sm text-navy-900">
                  <span>Total Amount</span>
                  <span className="text-teal-700 text-base">
                    ₹{Number(totalPrice).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* User Notice */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Booking for: <strong className="text-navy-900">{user?.name || user?.email || 'Authenticated Traveler'}</strong>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Proceed to Checkout & Payment</span>
              </button>

              <p className="text-center text-[10px] text-slate-400">
                🔒 Includes review, server price validation & Razorpay verification.
              </p>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
}
