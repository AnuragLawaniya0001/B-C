import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { Loader } from './components/ui/Loader';

// Lazy-loaded Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const StorePage = lazy(() => import('./pages/public/StorePage'));
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'));
const CookeyPage = lazy(() => import('./pages/public/CookeyPage'));
const MembershipPage = lazy(() => import('./pages/public/MembershipPage'));
const DormitoryPage = lazy(() => import('./pages/public/DormitoryPage'));
const PhysioPage = lazy(() => import('./pages/public/PhysioPage'));
const ArmyOfferPage = lazy(() => import('./pages/public/ArmyOfferPage'));
const OffersPage = lazy(() => import('./pages/public/OffersPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const RefundPolicyPage = lazy(() => import('./pages/public/RefundPolicyPage'));
const ShippingPolicyPage = lazy(() => import('./pages/public/ShippingPolicyPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));

// Lazy-loaded Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/auth/VerifyOtpPage'));
const PasswordPage = lazy(() => import('./pages/auth/PasswordPage'));
const KycPage = lazy(() => import('./pages/auth/KycPage'));
const RegisterSuccessPage = lazy(() => import('./pages/auth/RegisterSuccessPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Lazy-loaded Dashboard pages
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const CardPage = lazy(() => import('./pages/dashboard/CardPage'));
const WalletPage = lazy(() => import('./pages/dashboard/WalletPage'));
const CookeyTrackerPage = lazy(() => import('./pages/dashboard/CookeyTrackerPage'));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage'));
const CouponsPage = lazy(() => import('./pages/dashboard/CouponsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));

// Lazy-loaded Checkout pages
const CartPage = lazy(() => import('./pages/checkout/CartPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/checkout/CheckoutSuccessPage'));

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
          {/* Public Storefront Routes with Storefront Header and Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/catalogue" element={<StorePage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/store/:slug" element={<ProductDetailPage />} />
            <Route path="/store/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cookey" element={<CookeyPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/dormitory" element={<DormitoryPage />} />
            <Route path="/physio" element={<PhysioPage />} />
            <Route path="/army-offer" element={<ArmyOfferPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />

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

            {/* Authenticated Customer Account Single Pages (Inside PublicLayout) */}
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

            {/* Legacy Dashboard URLs gracefully redirected to single pages */}
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
