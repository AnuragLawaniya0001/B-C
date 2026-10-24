import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PartnerLayout } from './components/layout/PartnerLayout';

import PartnerLoginPage from './pages/PartnerLoginPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PartnerLoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Partner Authenticated Views */}
      <Route element={<PartnerLayout />}>
        <Route path="/dashboard" element={<PartnerDashboardPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
