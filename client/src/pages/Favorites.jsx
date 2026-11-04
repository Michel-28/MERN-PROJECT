import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Compass, MapPin, ArrowRight } from 'lucide-react';
import { getFavorites } from '../services/api';
import { useDemoUser } from '../context/DemoUserContext';
import DestinationCard from '../components/DestinationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Favorites() {
  const { user, isAuthenticated, openLoginModal } = useDemoUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavs = async () => {
    if (!isAuthenticated || !user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getFavorites(user.email);
      setFavorites(res.data.data || []);
    } catch (err) {
      console.error('Error fetching favorites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavs();
  }, [isAuthenticated, user?.email]);

  const handleFavoriteChange = () => {
    fetchFavs();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 mb-2">Saved Favorites</h2>
        <p className="text-xs text-slate-500 mb-6">
          Sign in with your email to see and manage your bookmarked dream destinations.
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
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>Saved Bucket List</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            My Favorite Destinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Destinations you've bookmarked for your upcoming travel adventures.
          </p>
        </div>

        <Link
          to="/destinations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700"
        >
          <span>Discover more destinations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner message="Loading your favorite destinations..." />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="No favorites saved yet"
          description="Click the heart icon on any destination card to save it to your personal bucket list."
          actionLabel="Explore Destinations"
          onAction={() => window.location.assign('/destinations')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {favorites.map((fav) => {
            const dest = fav.destination;
            if (!dest) return null;
            return (
              <DestinationCard
                key={fav._id}
                destination={dest}
                isFavorite={true}
                onFavoriteChange={handleFavoriteChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
