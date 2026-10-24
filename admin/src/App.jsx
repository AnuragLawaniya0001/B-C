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
import PagesPage from './pages/PagesPage';
import PageEditorPage from './pages/PageEditorPage';
import BannersPage from './pages/BannersPage';
import FaqsPage from './pages/FaqsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Admin Panel Routes with Layout */}
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/kyc" element={<KycQueuePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/cookey" element={<CookeyBuyersPage />} />
        <Route path="/lucky-draw" element={<LuckyDrawPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/pages" element={<PagesPage />} />
        <Route path="/pages/edit/:slug" element={<PageEditorPage />} />
        <Route path="/banners" element={<BannersPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
