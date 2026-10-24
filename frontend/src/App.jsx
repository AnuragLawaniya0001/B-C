import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthBootstrap } from './components/auth/AuthBootstrap';

// Public pages
import HomePage from './pages/public/HomePage';
import StorePage from './pages/public/StorePage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import CookeyPage from './pages/public/CookeyPage';
import MembershipPage from './pages/public/MembershipPage';
import DormitoryPage from './pages/public/DormitoryPage';
import PhysioPage from './pages/public/PhysioPage';
import ArmyOfferPage from './pages/public/ArmyOfferPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import PasswordPage from './pages/auth/PasswordPage';
import KycPage from './pages/auth/KycPage';
import RegisterSuccessPage from './pages/auth/RegisterSuccessPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Dashboard pages
import OverviewPage from './pages/dashboard/OverviewPage';
import CardPage from './pages/dashboard/CardPage';
import WalletPage from './pages/dashboard/WalletPage';
import CookeyTrackerPage from './pages/dashboard/CookeyTrackerPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import CouponsPage from './pages/dashboard/CouponsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Checkout pages
import CartPage from './pages/checkout/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import CheckoutSuccessPage from './pages/checkout/CheckoutSuccessPage';

export default function App() {
  return (
    <AuthBootstrap>
      {/* Global Notification Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Pages with Header and Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/:slug" element={<ProductDetailPage />} />
          <Route path="/cookey" element={<CookeyPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/dormitory" element={<DormitoryPage />} />
          <Route path="/physio" element={<PhysioPage />} />
          <Route path="/army-offer" element={<ArmyOfferPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth routes wrapped in public header/footer */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/register/password" element={<PasswordPage />} />
          <Route path="/register/kyc" element={<KycPage />} />
          {/* Legacy membership-pay route redirected to register success */}
          <Route
            path="/register/membership-pay"
            element={<Navigate to="/register/success" replace />}
          />
          <Route path="/register/success" element={<RegisterSuccessPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Cart & Checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dashboard Routes with Sidebar Layout (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="card" element={<CardPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="cookey" element={<CookeyTrackerPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthBootstrap>
  );
}
