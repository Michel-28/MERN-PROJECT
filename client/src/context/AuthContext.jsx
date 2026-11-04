import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  adminLoginUser,
  registerUser,
  verifyOtp,
  resendOtp,
  googleAuthUser,
  getMe,
  updateProfile,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('travelease_auth_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('travelease_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync token and user with localStorage and backend
  const verifySession = useCallback(async () => {
    const storedToken = localStorage.getItem('travelease_auth_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getMe();
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('travelease_auth_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err?.response?.data?.message || err.message);
      localStorage.removeItem('travelease_auth_token');
      localStorage.removeItem('travelease_auth_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // User Login
  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('travelease_auth_token', receivedToken);
      localStorage.setItem('travelease_auth_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  // Administrator Login
  const adminLogin = async (email, password) => {
    const res = await adminLoginUser({ email, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('travelease_auth_token', receivedToken);
      localStorage.setItem('travelease_auth_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Administrator authentication failed');
  };

  // User Registration
  const register = async (formData) => {
    const res = await registerUser(formData);
    if (res.data?.success) {
      if (res.data.requiresOtp) {
        return res.data;
      }
      if (res.data.token && res.data.user) {
        const { token: receivedToken, user: receivedUser } = res.data;
        localStorage.setItem('travelease_auth_token', receivedToken);
        localStorage.setItem('travelease_auth_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        return receivedUser;
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  // Verify OTP Code
  const verifyEmailOtp = async ({ email, otp }) => {
    const res = await verifyOtp({ email, otp });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      if (receivedToken && receivedUser) {
        localStorage.setItem('travelease_auth_token', receivedToken);
        localStorage.setItem('travelease_auth_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Verification failed');
  };

  // Resend OTP Code
  const resendVerificationOtp = async ({ email }) => {
    const res = await resendOtp({ email });
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to resend verification code');
  };

  // Google Login / OAuth
  const googleLogin = async ({ credential, role = 'user', email, name, avatar, googleId }) => {
    const res = await googleAuthUser({ credential, role, email, name, avatar, googleId });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('travelease_auth_token', receivedToken);
      localStorage.setItem('travelease_auth_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Google authentication failed');
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('travelease_auth_token');
    localStorage.removeItem('travelease_auth_user');
    setToken(null);
    setUser(null);
  };

  // Profile update
  const updateUser = async (profileData) => {
    const res = await updateProfile(profileData);
    if (res.data?.success) {
      setUser(res.data.user);
      localStorage.setItem('travelease_auth_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Failed to update profile');
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        adminLogin,
        register,
        verifyEmailOtp,
        resendVerificationOtp,
        googleLogin,
        logout,
        updateUser,
        // Backward-compatibility props for old components
        openLoginModal: () => {},
        closeLoginModal: () => {},
        isLoginModalOpen: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Backward compatibility alias so existing components don't break
export const useDemoUser = useAuth;
export const DemoUserProvider = AuthProvider;
