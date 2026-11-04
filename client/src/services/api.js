import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('travelease_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/admin-login')) {
      // If 401 on protected endpoint, session expired
      localStorage.removeItem('travelease_auth_token');
      localStorage.removeItem('travelease_auth_user');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const registerUser = (data) => api.post('/auth/register', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const resendOtp = (data) => api.post('/auth/resend-otp', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const adminLoginUser = (data) => api.post('/auth/admin-login', data);
export const googleAuthUser = (data) => api.post('/auth/google', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

// ==================== DESTINATION APIs ====================
export const getDestinations = (params) => api.get('/destinations', { params });
export const getFeaturedDestinations = () => api.get('/destinations/featured');
export const getDestination = (idOrSlug) => api.get(`/destinations/${idOrSlug}`);
export const createDestination = (data) => api.post('/destinations', data);
export const updateDestination = (id, data) => api.patch(`/destinations/${id}`, data);
export const deleteDestination = (id) => api.delete(`/destinations/${id}`);

// ==================== PACKAGE APIs ====================
export const getPackages = (params) => api.get('/packages', { params });
export const getPackage = (idOrSlug) => api.get(`/packages/${idOrSlug}`);
export const getPackageAvailability = (idOrSlug, date) =>
  api.get(`/packages/${idOrSlug}/availability`, { params: { date } });
export const createPackage = (data) => api.post('/packages', data);
export const updatePackage = (id, data) => api.patch(`/packages/${id}`, data);
export const deletePackage = (id) => api.delete(`/packages/${id}`);

// ==================== TRIP APIs ====================
export const getTrips = (email) => api.get('/trips', { params: { email } });
export const getTrip = (id) => api.get(`/trips/${id}`);
export const createTrip = (data) => api.post('/trips', data);
export const updateTrip = (id, data) => api.patch(`/trips/${id}`, data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);

// ==================== FAVORITE APIs ====================
export const getFavorites = (email) => api.get('/favorites', { params: { email } });
export const addFavorite = (email, destination) => api.post('/favorites', { email, destination });
export const removeFavorite = (id, email, destination) => {
  if (id) {
    return api.delete(`/favorites/${id}`);
  }
  return api.delete('/favorites', { params: { email, destination } });
};

// ==================== BOOKING APIs ====================
export const getBookings = (params) => {
  if (typeof params === 'string') {
    return api.get('/bookings', { params: { email: params } });
  }
  return api.get('/bookings', { params });
};
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const createBooking = (data) => api.post('/bookings', data);
export const cancelBooking = (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason });

// ==================== PAYMENT APIs ====================
export const createPaymentOrder = (data) => api.post('/payments/create-order', data);
export const verifyPayment = (data) => api.post('/payments/verify', data);
export const reportPaymentFailure = (data) => api.post('/payments/failure', data);
export const getReceipt = (bookingId) => api.get(`/payments/receipt/${bookingId}`);

// ==================== ADMIN APIs ====================
export const getAdminStats = () => api.get('/admin/dashboard/stats');
export const getAdminBookings = (params) => api.get('/admin/bookings', { params });
export const getAdminBookingDetails = (id) => api.get(`/admin/bookings/${id}`);
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminDestinations = () => api.get('/admin/destinations');
export const getAdminPackages = () => api.get('/admin/packages');

export default api;
