import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public pages
import Home from './pages/Home';
import Destinations from './pages/Destinations';
import DestinationDetails from './pages/DestinationDetails';
import Packages from './pages/Packages';
import PackageDetails from './pages/PackageDetails';
import About from './pages/About';
import Contact from './pages/Contact';

// Authentication pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import AdminLogin from './pages/admin/AdminLogin';

// User pages
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import TripPlanner from './pages/TripPlanner';
import TripNew from './pages/TripNew';
import TripDetail from './pages/TripDetail';
import MyBookings from './pages/MyBookings';

// Booking & Checkout Flow
import BookingFlow from './pages/BookingFlow';
import BookingConfirmation from './pages/BookingConfirmation';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminDestinationForm from './pages/admin/AdminDestinationForm';
import AdminPackages from './pages/admin/AdminPackages';
import AdminPackageForm from './pages/admin/AdminPackageForm';

// Fallback
import NotFound from './pages/NotFound';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'travelease-google-client-placeholder.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<RootLayout />}>
            {/* Public Pages */}
            <Route index element={<Home />} />
            <Route path="destinations" element={<Destinations />} />
            <Route path="destinations/:slug" element={<DestinationDetails />} />
            <Route path="packages" element={<Packages />} />
            <Route path="packages/:slug" element={<PackageDetails />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />

            {/* Authentication Pages */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-otp" element={<VerifyOtp />} />
            <Route path="admin/login" element={<AdminLogin />} />

            {/* Protected User Pages */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-trips"
              element={
                <ProtectedRoute>
                  <TripPlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-trips/new"
              element={
                <ProtectedRoute>
                  <TripNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-trips/:id"
              element={
                <ProtectedRoute>
                  <TripDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-bookings/:id"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />

            {/* Booking & Checkout */}
            <Route
              path="packages/:slug/book"
              element={
                <ProtectedRoute>
                  <BookingFlow />
                </ProtectedRoute>
              }
            />
            <Route
              path="booking-confirmation/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Console */}
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="admin/bookings"
              element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="admin/destinations"
              element={
                <AdminRoute>
                  <AdminDestinations />
                </AdminRoute>
              }
            />
            <Route
              path="admin/destinations/new"
              element={
                <AdminRoute>
                  <AdminDestinationForm />
                </AdminRoute>
              }
            />
            <Route
              path="admin/destinations/:id/edit"
              element={
                <AdminRoute>
                  <AdminDestinationForm />
                </AdminRoute>
              }
            />
            <Route
              path="admin/packages"
              element={
                <AdminRoute>
                  <AdminPackages />
                </AdminRoute>
              }
            />
            <Route
              path="admin/packages/new"
              element={
                <AdminRoute>
                  <AdminPackageForm />
                </AdminRoute>
              }
            />
            <Route
              path="admin/packages/:id/edit"
              element={
                <AdminRoute>
                  <AdminPackageForm />
                </AdminRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </GoogleOAuthProvider>
);
}
