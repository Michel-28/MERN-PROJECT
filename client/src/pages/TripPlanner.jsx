import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  Trash2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { getTrips, deleteTrip } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

export default function TripPlanner() {
  const { user, isAuthenticated, openLoginModal } = useDemoUser();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    if (!isAuthenticated || !user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getTrips(user.email);
      setTrips(res.data.data || []);
    } catch (err) {
      console.error('Error fetching trips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [isAuthenticated, user?.email]);

  const handleDeleteTrip = async (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete trip "${name}"?`)) return;

    try {
      await deleteTrip(id);
      toast.success('Trip deleted successfully');
      fetchTrips();
    } catch {
      toast.error('Failed to delete trip');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 mb-2">Personal Trip Planner</h2>
        <p className="text-xs text-slate-500 mb-6">
          Sign in with your email to create and track custom travel itineraries.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Itinerary Builder</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            My Planned Trips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build day-by-day schedules, calculate activity costs, and track your vacation budget.
          </p>
        </div>

        <Link
          to="/my-trips/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Trip</span>
        </Link>
      </div>

      {/* Trips list */}
      {loading ? (
        <LoadingSpinner message="Loading your planned trips..." />
      ) : trips.length === 0 ? (
        <EmptyState
          title="No trips planned yet"
          description="Create your first custom trip itinerary, specify target budget, and organize day-by-day activities."
          actionLabel="Create First Trip"
          onAction={() => navigate('/my-trips/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const daysCount = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

            const totalActivityCost = trip.activities?.reduce((sum, act) => sum + (Number(act.cost) || 0), 0) || 0;
            const targetBudget = Number(trip.targetBudget) || 0;
            const remaining = targetBudget > 0 ? targetBudget - totalActivityCost : null;

            return (
              <div
                key={trip._id}
                onClick={() => navigate(`/my-trips/${trip._id}`)}
                className="group cursor-pointer bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                      {daysCount} Days Trip
                    </span>
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip._id, trip.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-navy-900 group-hover:text-teal-600 transition mb-2">
                    {trip.name}
                  </h3>

                  {/* Destinations Tag */}
                  {trip.destinations && trip.destinations.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">
                        {trip.destinations.map((d) => d.name || 'Destination').join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Dates & Travelers */}
                  <div className="space-y-1.5 text-xs text-slate-500 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        {start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} –{' '}
                        {end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{trip.travelers} Traveler(s)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Budget & Activity Count */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Total Planned Spend</span>
                    <span className="font-extrabold text-navy-900">
                      ₹{totalActivityCost.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {targetBudget > 0 && (
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-slate-400">Target Budget</span>
                      <span className="font-semibold text-slate-700">
                        ₹{targetBudget.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="inline-flex items-center justify-between w-full pt-2 text-xs font-bold text-teal-600 group-hover:text-teal-700">
                    <span>{trip.activities?.length || 0} Scheduled Activities</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
