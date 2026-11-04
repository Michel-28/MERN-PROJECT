import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  MapPin,
  Package,
  CalendarCheck2,
  Heart,
  CalendarDays,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Users,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    setMobileMenuOpen(false);
    toast.success('Signed out successfully');
    navigate('/');
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
      isActive
        ? 'text-teal-700 bg-teal-50 font-bold shadow-xs'
        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-navy-900">
                Travel<span className="text-teal-600">Ease</span>
              </span>
              <span className="text-[9px] tracking-widest uppercase text-slate-400 font-bold -mt-1">
                Tour Planner
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink to="/" className={navClass}>
              Home
            </NavLink>
            <NavLink to="/destinations" className={navClass}>
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Destinations
            </NavLink>
            <NavLink to="/packages" className={navClass}>
              <Package className="w-3.5 h-3.5 text-teal-600" />
              Tour Packages
            </NavLink>
            <NavLink to="/my-trips" className={navClass}>
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              Plan a Trip
            </NavLink>

            {/* Authenticated user links */}
            {isAuthenticated && !isAdmin && (
              <>
                <NavLink to="/my-bookings" className={navClass}>
                  <CalendarCheck2 className="w-3.5 h-3.5 text-teal-600" />
                  My Bookings
                </NavLink>
                <NavLink to="/favorites" className={navClass}>
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Favorites
                </NavLink>
              </>
            )}

            {/* Admin-only quick links */}
            {isAdmin && (
              <>
                <NavLink to="/admin" className={navClass}>
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                  Admin Console
                </NavLink>
                <NavLink to="/admin/bookings" className={navClass}>
                  <CalendarCheck2 className="w-3.5 h-3.5 text-teal-600" />
                  Bookings
                </NavLink>
                <NavLink to="/admin/users" className={navClass}>
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  Users
                </NavLink>
              </>
            )}
          </nav>

          {/* Desktop Right Actions: Role-Aware Auth Controls */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* If not logged in */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition border border-slate-200"
                  title="Administrator Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Admin</span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-navy-900 hover:bg-slate-100 transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                  <span>Sign In</span>
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition shadow-teal-500/10"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            ) : (
              /* If Authenticated */
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-medium text-navy-900 transition"
                >
                  <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] ${isAdmin ? 'bg-navy-900' : 'bg-teal-600'}`}>
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate font-bold text-navy-900">{user?.name}</span>
                  {isAdmin && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-extrabold">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 text-xs text-slate-700 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-extrabold text-navy-900">{user.name}</p>
                      <p className="text-slate-400 truncate text-[11px]">{user.email}</p>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        Role: {user.role}
                      </span>
                    </div>

                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 font-semibold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-teal-600" />
                          Admin Console
                        </Link>
                        <Link
                          to="/admin/bookings"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <CalendarCheck2 className="w-4 h-4 text-teal-600" />
                          Customer Bookings
                        </Link>
                        <Link
                          to="/admin/users"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <Users className="w-4 h-4 text-teal-600" />
                          Registered Users
                        </Link>
                        <Link
                          to="/admin/destinations"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <MapPin className="w-4 h-4 text-teal-600" />
                          Manage Destinations
                        </Link>
                        <Link
                          to="/admin/packages"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <Package className="w-4 h-4 text-teal-600" />
                          Manage Packages
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 font-semibold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-teal-600" />
                          My Dashboard
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <CalendarCheck2 className="w-4 h-4 text-teal-600" />
                          My Bookings & Receipts
                        </Link>
                        <Link
                          to="/my-trips"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <CalendarDays className="w-4 h-4 text-teal-600" />
                          My Planned Trips
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          Saved Favorites
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger trigger */}
          <div className="flex lg:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold"
              >
                Sign In
              </Link>
            ) : (
              <span className="text-xs font-bold text-navy-900 px-2 truncate max-w-[100px]">
                {user.name.split(' ')[0]}
              </span>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-lg">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Home
          </NavLink>
          <NavLink
            to="/destinations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Destinations
          </NavLink>
          <NavLink
            to="/packages"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tour Packages
          </NavLink>
          <NavLink
            to="/my-trips"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Plan a Trip
          </NavLink>

          {/* Role-Specific Mobile Links */}
          {isAuthenticated && !isAdmin && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                My Dashboard
              </NavLink>
              <NavLink
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                My Bookings & Receipts
              </NavLink>
              <NavLink
                to="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Saved Favorites
              </NavLink>
            </>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-700 px-3 tracking-wider block">
                Administrator Actions
              </span>
              <NavLink
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Admin Overview
              </NavLink>
              <NavLink
                to="/admin/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Bookings
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Registered Users
              </NavLink>
              <NavLink
                to="/admin/destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Destinations
              </NavLink>
              <NavLink
                to="/admin/packages"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Packages
              </NavLink>
            </div>
          )}

          {/* Bottom user action bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                <div className="truncate">
                  <p className="font-bold text-xs text-navy-900">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  Register
                </Link>
                <div className="col-span-2 pt-1 text-center">
                  <Link
                    to="/admin/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-slate-500 hover:text-navy-900"
                  >
                    Go to Administrator Portal &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
