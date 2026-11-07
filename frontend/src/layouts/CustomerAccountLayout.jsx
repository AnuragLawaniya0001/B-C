import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Wallet,
  Sparkles,
  Ticket,
  User,
  Settings,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { CinematicHeader } from '../components/navigation/CinematicHeader';

export function CustomerAccountLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Digital Pass / Card', to: '/dashboard/card', icon: CreditCard },
    { label: 'Order History', to: '/dashboard/orders', icon: Package },
    { label: 'My Wallet', to: '/dashboard/wallet', icon: Wallet },
    { label: 'Cookey Tracker', to: '/dashboard/cookey', icon: Sparkles },
    { label: 'Coupons & Vouchers', to: '/dashboard/coupons', icon: Ticket },
    { label: 'Profile Information', to: '/dashboard/profile', icon: User },
    { label: 'Account Settings', to: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <CinematicHeader />

      {/* Main Container with Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Account Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-900 to-primary-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {user?.full_name || 'Customer Account'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{user?.email || user?.mobile}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      user?.has_membership ? 'text-green-500' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-600">
                    {user?.has_membership ? 'Active Member' : 'Free Account'}
                  </span>
                </div>
                {!user?.has_membership && (
                  <Link
                    to="/membership"
                    className="text-xs font-bold text-accent-600 hover:text-accent-700"
                  >
                    Upgrade →
                  </Link>
                )}
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-900 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          {/* Account Sub-page Content */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default CustomerAccountLayout;
