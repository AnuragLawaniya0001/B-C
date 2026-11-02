import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingLayout } from './components/layout/LandingLayout';
import { EcommerceLayout } from './components/layout/EcommerceLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { Loader } from './components/ui/Loader';

// Lazy-loaded Business / Landing pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const CookeyPage = lazy(() => import('./pages/public/CookeyPage'));
const MembershipPage = lazy(() => import('./pages/public/MembershipPage'));
const DormitoryPage = lazy(() => import('./pages/public/DormitoryPage'));
const PhysioPage = lazy(() => import('./pages/public/PhysioPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const RefundPolicyPage = lazy(() => import('./pages/public/RefundPolicyPage'));
const ShippingPolicyPage = lazy(() => import('./pages/public/ShippingPolicyPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));

// Lazy-loaded E-Commerce Shopping pages
const CinematicCommercePage = lazy(() => import('./pages/public/CinematicCommercePage'));
const StorePage = lazy(() => import('./pages/public/StorePage'));
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'));
const OffersPage = lazy(() => import('./pages/public/OffersPage'));
const CartPage = lazy(() => import('./pages/checkout/CartPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/checkout/CheckoutSuccessPage'));

// Lazy-loaded Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/auth/VerifyOtpPage'));
const PasswordPage = lazy(() => import('./pages/auth/PasswordPage'));
const KycPage = lazy(() => import('./pages/auth/KycPage'));
const RegisterSuccessPage = lazy(() => import('./pages/auth/RegisterSuccessPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Lazy-loaded Customer Dashboard pages
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const CardPage = lazy(() => import('./pages/dashboard/CardPage'));
const WalletPage = lazy(() => import('./pages/dashboard/WalletPage'));
const CookeyTrackerPage = lazy(() => import('./pages/dashboard/CookeyTrackerPage'));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage'));
const CouponsPage = lazy(() => import('./pages/dashboard/CouponsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader size="lg" text="Loading BIGCHAMP Experience..." />
    </div>
  );
}

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

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* =========================================================================
              1. CINEMATIC BRAND LANDING PAGE (HOLYWOOD 60/120FPS CANVAS SCRUBBER)
              Dedicated full-screen experience with video-frame timeline, HUD & direct portal
              ========================================================================= */}
          <Route path="/" element={<LandingPage />} />

          {/* =========================================================================
              2. BUSINESS / CORPORATE ECOSYSTEM ROUTES (SERVICES & LEGAL)
              Uses LandingLayout: LandingHeader (Business Navbar) + LandingFooter
              ========================================================================= */}
          <Route element={<LandingLayout />}>
            {/* Corporate & Vertical Services */}
            <Route path="/cookey" element={<CookeyPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/dormitory" element={<DormitoryPage />} />
            <Route path="/physio" element={<PhysioPage />} />
            <Route path="/army-offer" element={<Navigate to="/offers" replace />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/register/password" element={<PasswordPage />} />
            <Route path="/register/kyc" element={<KycPage />} />
            <Route
              path="/register/membership-pay"
              element={<Navigate to="/register/success" replace />}
            />
            <Route path="/register/success" element={<RegisterSuccessPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* =========================================================================
              3. CINEMATIC SPORTS COMMERCE EXPERIENCE ("BIRTH OF A LEGEND")
              Standalone full-viewport immersive experience with embedded HUD & post-story store
              ========================================================================= */}
          <Route path="/store" element={<CinematicCommercePage />} />
          <Route path="/cinematic" element={<CinematicCommercePage />} />

          {/* =========================================================================
              4. DEDICATED E-COMMERCE SHOPPING ROUTES (CATALOG & CHECKOUT)
              Uses EcommerceLayout: Pure Shopping Navbar (Categories, Search, Cart, Deals) + Shopping Footer
              ========================================================================= */}
          <Route element={<EcommerceLayout />}>
            {/* Catalog Filter Hub */}
            <Route path="/catalogue" element={<StorePage />} />
            <Route path="/shop" element={<Navigate to="/store" replace />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/store/:slug" element={<ProductDetailPage />} />
            <Route path="/store/product/:slug" element={<ProductDetailPage />} />

            {/* Cart & Checkout */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

            {/* Customer Account Pages */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/card"
              element={
                <ProtectedRoute>
                  <CardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/card"
              element={
                <ProtectedRoute>
                  <CardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/wallet"
              element={
                <ProtectedRoute>
                  <WalletPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <ProtectedRoute>
                  <CouponsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/coupons"
              element={
                <ProtectedRoute>
                  <CouponsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cookey-tracker"
              element={
                <ProtectedRoute>
                  <CookeyTrackerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/cookey"
              element={
                <ProtectedRoute>
                  <CookeyTrackerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Legacy Dashboard URL redirects */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/orders" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/orders"
              element={
                <ProtectedRoute>
                  <Navigate to="/orders" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/card"
              element={
                <ProtectedRoute>
                  <Navigate to="/card" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/wallet"
              element={
                <ProtectedRoute>
                  <Navigate to="/wallet" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/coupons"
              element={
                <ProtectedRoute>
                  <Navigate to="/coupons" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <Navigate to="/profile" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cookey"
              element={
                <ProtectedRoute>
                  <Navigate to="/cookey-tracker" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Navigate to="/settings" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Navigate to="/orders" replace />
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthBootstrap>
  );
}
