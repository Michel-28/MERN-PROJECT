import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide administrator credentials');
      return;
    }

    try {
      setLoading(true);
      const user = await adminLogin(email.trim().toLowerCase(), password);
      toast.success(`Welcome, Administrator ${user.name}!`);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid administrator credentials';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900 text-white">
      <div className="max-w-md w-full bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Restricted access for TravelEase system administrators. All management sessions are audited and role-verified on the server.
          </p>
        </div>

        {/* Security Alert */}
        {error ? (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-medium animate-fadeIn">
            {error}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Administrative accounts cannot be registered publicly and must be seeded via secure environment variables.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5 uppercase text-[10px] tracking-wider">
              Administrator Email <span className="text-teal-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@travelease.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-white font-medium text-xs sm:text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5 uppercase text-[10px] tracking-wider">
              Password <span className="text-teal-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-white font-medium text-xs sm:text-sm focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-teal-400 hover:bg-teal-300 shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating System...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-slate-950 px-3 text-slate-500 font-semibold tracking-wider">
              Or authenticate with
            </span>
          </div>
        </div>

        {/* Google OAuth for Admin */}
        <GoogleAuthButton
          role="admin"
          isDark={true}
          buttonText="Sign In with Google Admin"
        />

        {/* Back Link */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:text-teal-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </Link>

          <Link
            to="/login"
            className="font-bold text-teal-400 hover:underline"
          >
            Traveler Login &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
