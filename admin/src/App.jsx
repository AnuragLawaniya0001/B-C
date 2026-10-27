import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';

import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UsersPage from './pages/UsersPage';
import KycQueuePage from './pages/KycQueuePage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CookeyBuyersPage from './pages/CookeyBuyersPage';
import LuckyDrawPage from './pages/LuckyDrawPage';
import PartnersPage from './pages/PartnersPage';
import FinancePage from './pages/FinancePage';
import SettingsPage from './pages/SettingsPage';
import BannersPage from './pages/BannersPage';
import FaqsPage from './pages/FaqsPage';
import OffersCouponsPage from './pages/OffersCouponsPage';
import PaymentsPage from './pages/PaymentsPage';
import MembershipsPage from './pages/MembershipsPage';
import MediaStudioPage from './pages/MediaStudioPage';
import StorefrontBuilderPage from './pages/StorefrontBuilderPage';
import PromotionsManagerPage from './pages/PromotionsManagerPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Admin Panel Routes with Layout */}
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/media-library" element={<Navigate to="/storefront-builder" replace />} />
        <Route path="/storefront-builder" element={<StorefrontBuilderPage />} />
        <Route path="/storefront/homepage" element={<StorefrontBuilderPage />} />
        <Route path="/marketing-popups" element={<PromotionsManagerPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/kyc" element={<KycQueuePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/coupons" element={<OffersCouponsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/cookey" element={<CookeyBuyersPage />} />
        <Route path="/lucky-draw" element={<LuckyDrawPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/finance" element={<FinancePage />} />

        <Route path="/pages/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/banners" element={<BannersPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
