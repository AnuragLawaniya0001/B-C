import React from 'react';
import OverviewPage from '../pages/dashboard/OverviewPage';
import CardPage from '../pages/dashboard/CardPage';
import WalletPage from '../pages/dashboard/WalletPage';
import CookeyTrackerPage from '../pages/dashboard/CookeyTrackerPage';
import OrdersPage from '../pages/dashboard/OrdersPage';
import CouponsPage from '../pages/dashboard/CouponsPage';
import ProfilePage from '../pages/dashboard/ProfilePage';
import SettingsPage from '../pages/dashboard/SettingsPage';

export const dashboardRoutes = [
  { index: true, element: <OverviewPage /> },
  { path: 'card', element: <CardPage /> },
  { path: 'wallet', element: <WalletPage /> },
  { path: 'cookey', element: <CookeyTrackerPage /> },
  { path: 'orders', element: <OrdersPage /> },
  { path: 'coupons', element: <CouponsPage /> },
  { path: 'profile', element: <ProfilePage /> },
  { path: 'settings', element: <SettingsPage /> },
];
