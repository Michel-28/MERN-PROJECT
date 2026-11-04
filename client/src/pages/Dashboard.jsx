import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CalendarCheck2,
  Heart,
  Plus,
  Compass,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { useDemoUser } from '../context/DemoUserContext';
import { getTrips, getBookings, getFavorites } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { user, isAuthenticated, openLoginModal } = useDemoUser();

  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      Promise.all([
        getTrips(user.email),
        getBookings(user.email),
        getFavorites(user.email),
      ])
        .then(([tripRes, bookRes, favRes]) => {
          setTrips(tripRes.data.data || []);
          setBookings(bookRes.data.data || []);
          setFavorites(favRes.data.data || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 mb-2">Sign In Required</h2>
        <p className="text-xs text-slate-500 mb-6">
          Sign in to your TravelEase account to view your personalized dashboard and active itineraries.
        </p>
        <Link
          to="/login"
          className="inline-block py-3 px-6 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition"
        >
          Sign In to TravelEase
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading your personal traveler dashboard..." />;

  // Calculations
  const confirmedBookings = bookings.filter((b) => b.status === 'Confirmed');
  const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled');

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Helper: calculate countdown days
  const getCountdownDays = (dateStr) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Upcoming Trips (trips with end date >= today)
  const upcomingTrips = trips
    .filter((t) => new Date(t.endDate) >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Total Planned Spending (sum of planned trip expenses + confirmed tour package bookings)
  const totalTripExpenses = trips.reduce(
    (sum, t) => sum + (Number(t.totalPlannedExpenses) || Number(t.targetBudget) || 0),
    0
  );
  const totalBookingExpenses = confirmedBookings.reduce(
    (sum, b) => sum + (Number(b.totalAmount) || 0),
    0
  );
  const grandEstimatedSpending = totalTripExpenses + totalBookingExpenses;

  // Overall Budget Utilization
  const totalTargetBudgets = trips.reduce(
    (sum, t) => sum + (Number(t.targetBudget) || 0),
    0
  );
  const overallBudgetUtilization =
    totalTargetBudgets > 0
      ? Math.min(100, Math.round((totalTripExpenses / totalTargetBudgets) * 100))
      : 0;

  // Collect Next Upcoming Activities from all upcoming trips
  const upcomingActivities = [];
  upcomingTrips.forEach((trip) => {
    (trip.activities || []).forEach((act) => {
      let actDate = act.date ? new Date(act.date) : new Date(trip.startDate);
      actDate.setDate(actDate.getDate() + (Number(act.day || 1) - 1));
      if (actDate >= now) {
        upcomingActivities.push({
          ...act,
          tripId: trip._id,
          tripName: trip.name,
          computedDate: actDate,
        });
      }
    });
  });
  upcomingActivities.sort((a, b) => a.computedDate - b.computedDate);

  // Collect Incomplete Checklist Tasks from upcoming trips
  const pendingChecklistTasks = [];
  upcomingTrips.forEach((trip) => {
    (trip.checklist || []).forEach((task) => {
      if (!task.completed) {
        pendingChecklistTasks.push({
          ...task,
          tripId: trip._id,
          tripName: trip.name,
        });
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Traveler Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Welcome back, {user.name || user.email}!
          </h1>
          <p className="text-xs text-slate-300">
            Account: <strong>{user.email}</strong> • Real-time overview of your itineraries, reservations, and bucket list.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/my-trips/new"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Plan New Trip</span>
          </Link>
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl font-bold text-xs text-navy-900 bg-white hover:bg-slate-100 shadow-md transition"
          >
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Explore Tours</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Planned Trips */}
        <Link
          to="/my-trips"
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Planned Trips
            </span>
            <div className="text-3xl font-black text-navy-900 mt-1">
              {trips.length}
            </div>
            <span className="text-[11px] font-semibold text-teal-600 group-hover:underline mt-1.5 inline-flex items-center gap-1">
              <span>{upcomingTrips.length} upcoming</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
        </Link>

        {/* Bookings with breakdown */}
        <Link
          to="/my-bookings"
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Tour Bookings
            </span>
            <div className="text-3xl font-black text-navy-900 mt-1">
              {bookings.length}
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-1.5 block">
              <strong className="text-emerald-600">{confirmedBookings.length}</strong> confirmed •{' '}
              <strong className="text-rose-500">{cancelledBookings.length}</strong> cancelled
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </Link>

        {/* Total Estimated Spending */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Planned Spending
            </span>
            <div className="text-2xl font-black text-navy-900 mt-1">
              ₹{grandEstimatedSpending.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              Trips & confirmed tours
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Budget Utilization
            </span>
            <div className="text-2xl font-black text-navy-900 mt-1">
              {overallBudgetUtilization}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              Across planned vacations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Upcoming Trips & Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Upcoming Trips & Countdowns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Upcoming Vacation Itineraries
                </h3>
                <p className="text-xs text-slate-500">
                  Trips scheduled on your calendar with live departure countdowns.
                </p>
              </div>
              <Link
                to="/my-trips"
                className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingTrips.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No upcoming trips scheduled.</p>
                <Link
                  to="/my-trips/new"
                  className="inline-block py-2 px-4 rounded-xl text-xs font-bold text-white bg-teal-600"
                >
                  Create Your First Trip
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.slice(0, 3).map((trip) => {
                  const daysToStart = getCountdownDays(trip.startDate);
                  const isOngoing = daysToStart <= 0 && getCountdownDays(trip.endDate) >= 0;

                  return (
                    <Link
                      key={trip._id}
                      to={`/my-trips/${trip._id}`}
                      className="block p-5 rounded-2xl border border-slate-200/80 hover:border-teal-500 hover:shadow-md transition bg-slate-50/50 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-navy-900 group-hover:text-teal-600 transition">
                              {trip.name}
                            </h4>
                            {isOngoing ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 animate-pulse">
                                Ongoing Now
                              </span>
                            ) : daysToStart > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                                Departs in {daysToStart} {daysToStart === 1 ? 'day' : 'days'}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-teal-600" />
                              {new Date(trip.startDate).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              –{' '}
                              {new Date(trip.endDate).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-teal-600" />
                              {trip.destinations?.map((d) => d.name).join(', ') || 'Custom Location'}
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Planned Budget
                          </span>
                          <span className="font-extrabold text-navy-900 text-sm">
                            ₹{(trip.totalPlannedExpenses || trip.targetBudget || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Next Itinerary Activities */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Next Scheduled Itinerary Activities</span>
            </h3>

            {upcomingActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                No upcoming activities scheduled on your active trips.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingActivities.slice(0, 4).map((act, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy-900">{act.title}</span>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {act.tripName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>Day {act.day} • {act.time || 'All Day'}</span>
                        {act.location && <span>• {act.location}</span>}
                      </div>
                    </div>

                    <span className="font-bold text-navy-900">
                      ₹{Number(act.cost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Incomplete Checklist Tasks & Quick Actions */}
        <div className="space-y-6">
          
          {/* Incomplete Checklist Tasks */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                <span>Pending Checklist Items</span>
              </h4>
              <span className="text-[11px] font-semibold text-slate-400">
                {pendingChecklistTasks.length} left
              </span>
            </div>

            {pendingChecklistTasks.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">No pending checklist items.</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {pendingChecklistTasks.slice(0, 5).map((task, idx) => (
                  <Link
                    key={idx}
                    to={`/my-trips/${task.tripId}`}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 block transition space-y-0.5"
                  >
                    <span className="font-medium text-navy-900 block truncate">{task.text}</span>
                    <span className="text-[10px] text-teal-600 font-semibold block">
                      {task.tripName}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 rounded-3xl p-6 border border-teal-100 shadow-sm space-y-4 text-xs">
            <h4 className="font-bold text-sm text-teal-950">
              Quick Navigation
            </h4>
            <div className="space-y-2">
              <Link
                to="/destinations"
                className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 font-bold text-navy-900 shadow-sm transition"
              >
                <span>Browse All Destinations</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                to="/packages"
                className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 font-bold text-navy-900 shadow-sm transition"
              >
                <span>Explore Tour Packages</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                to="/favorites"
                className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 font-bold text-navy-900 shadow-sm transition"
              >
                <span>View Saved Favorites ({favorites.length})</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
