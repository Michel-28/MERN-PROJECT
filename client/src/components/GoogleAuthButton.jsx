import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GoogleAuthButton({
  role = 'user',
  isDark = false,
  redirectPath,
}) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const destination = redirectPath || location.state?.from?.pathname || (role === 'admin' ? '/admin' : '/dashboard');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(clientId && clientId.trim() && !clientId.includes('your_google_oauth_client_id'));

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Did not receive credentials from Google');
      return;
    }

    try {
      setLoading(true);
      const user = await googleLogin({
        credential: credentialResponse.credential,
        role,
      });
      toast.success(`Welcome, ${user.name}!`);
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Sign-In failed or was closed. Please try again.');
  };

  if (!isConfigured) {
    return (
      <div
        className={`w-full p-3.5 rounded-2xl border text-center transition ${
          isDark
            ? 'bg-slate-900/90 border-slate-700/80 text-slate-300'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-bold text-xs">Real Google Sign-In</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Provide your Client ID in <code className="font-mono text-[10px] bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">client/.env</code> (<code className="font-mono text-[10px]">VITE_GOOGLE_CLIENT_ID</code>) to display the live Google button.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      {loading ? (
        <div className="py-2.5 px-4 text-xs font-semibold text-teal-500 animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating with Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!max-w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme={isDark ? 'filled_black' : 'outline'}
            size="large"
            text={role === 'admin' ? 'signin_with' : 'continue_with'}
            shape="rectangular"
            width="384"
          />
        </div>
      )}
    </div>
  );
}
