import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyOtp() {
  const { verifyEmailOtp, resendVerificationOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract initial email from query string or location state
  const queryEmail = new URLSearchParams(location.search).get('email') || location.state?.email || '';
  const [email, setEmail] = useState(queryEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!queryEmail);

  // 6 digits state
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  // 5-minute expiration countdown (300 seconds)
  const [expireSeconds, setExpireSeconds] = useState(300);

  // 60-second resend cooldown timer
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  // Expiration timer
  useEffect(() => {
    if (expireSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpireSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expireSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (!cleaned) {
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle single character
    newDigits[index] = cleaned[cleaned.length - 1];
    setDigits(newDigits);
    setError('');

    // Move to next input box if available
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numericData = pasteData.replace(/\D/g, '').slice(0, 6);
    if (!numericData) return;

    const newDigits = [...digits];
    for (let i = 0; i < numericData.length; i++) {
      newDigits[i] = numericData[i];
    }
    setDigits(newDigits);
    setError('');

    // Focus on the next available or last box
    const focusIndex = Math.min(numericData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError('');

    const fullOtp = digits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    if (!email || !email.trim()) {
      setError('Please provide the registered email address');
      setIsEditingEmail(true);
      return;
    }

    if (expireSeconds <= 0) {
      setError('Your verification code has expired. Please click "Resend Code" below.');
      return;
    }

    try {
      setLoading(true);
      await verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });

      toast.success('Email verified successfully! Welcome to TravelEase.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed. Please check the OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;

    if (!email || !email.trim()) {
      setError('Please provide your registered email address to resend OTP');
      setIsEditingEmail(true);
      return;
    }

    try {
      setResending(true);
      setError('');
      await resendVerificationOtp({ email: email.trim().toLowerCase() });
      toast.success('A fresh 6-digit verification code has been dispatched to your email!');
      setDigits(['', '', '', '', '', '']);
      setExpireSeconds(300); // Reset 5 minutes
      setCooldownSeconds(60); // Reset 60-second cooldown
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend code';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  // Format MM:SS for countdown
  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative overflow-hidden space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Enter the 6-digit verification code sent to your email address to activate your account.
          </p>
        </div>

        {/* Recipient Email Banner */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
          <div className="space-y-0.5 truncate pr-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Verification Code Sent To
            </span>
            {isEditingEmail ? (
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youremail@example.com"
                className="w-full text-xs font-semibold text-teal-800 bg-white px-2 py-1 rounded border border-teal-300 focus:outline-none"
              />
            ) : (
              <span className="font-bold text-teal-700 truncate block">
                {email || 'No email specified'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsEditingEmail(!isEditingEmail)}
            className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 shrink-0 hover:underline"
          >
            {isEditingEmail ? 'Save' : 'Change'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium animate-fadeIn flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-600">
              Enter 6-Digit OTP
            </label>
            <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-2xl border transition focus:outline-none ${
                    digit
                      ? 'border-teal-500 bg-teal-50/50 text-teal-900 shadow-sm'
                      : 'border-slate-300 bg-white text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Expiration Timer display */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Expires in:</span>
              <strong className={expireSeconds <= 60 ? 'text-rose-600 font-mono' : 'text-slate-700 font-mono'}>
                {formatTimer(expireSeconds)}
              </strong>
            </span>

            {/* Resend button with 60-second cooldown */}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldownSeconds > 0 || resending}
              className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : resending
                  ? 'Sending...'
                  : 'Resend Code'}
              </span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Verifying OTP...' : 'Verify & Activate Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back to Login link */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already verified or want to sign in?{' '}
          <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 hover:underline">
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

