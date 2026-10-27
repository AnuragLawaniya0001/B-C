import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Cookie,
  Package,
  Ticket,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Lock,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { getBusinessRules } = useSettingsStore();
  const navigate = useNavigate();

  const rules = getBusinessRules();
  const cardFee = Math.round((rules.card_fee_paise || 10000) / 100);
  const hasMembership = user?.has_membership === true;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleLockedClick = (e, featureName) => {
    e.preventDefault();
    setSidebarOpen(false);
    toast.error(`Get Bigchamp Card (₹${cardFee}) to unlock ${featureName}!`, {
      icon: '🔒',
    });
    navigate('/membership');
  };

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true, locked: false },
    { label: 'My Orders', to: '/dashboard/orders', icon: Package, locked: false },
    { label: 'Coupons & Vouchers', to: '/dashboard/coupons', icon: Ticket, locked: false },
    { label: 'Profile', to: '/dashboard/profile', icon: User, locked: false },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings, locked: false },
    {
      label: 'Digital Card',
      to: '/dashboard/card',
      icon: CreditCard,
      locked: !hasMembership,
      feature: 'Digital Card',
    },
    {
      label: 'Wallet & Cashback',
      to: '/dashboard/wallet',
      icon: Wallet,
      locked: !hasMembership,
      feature: 'Wallet & Cashback',
    },
    {
      label: 'Cookey Tracker',
      to: '/dashboard/cookey',
      icon: Cookie,
      locked: !hasMembership,
      feature: 'Cookey Tracker',
    },
    {
      label: 'Athlete Bookings',
      to: '/dormitory',
      icon: CalendarDays,
      locked: !hasMembership,
      feature: 'Dormitory & Physio Bookings',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="overflow-y-auto">
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <NavLink to="/" className="font-black text-xl tracking-tight text-primary-900">
              BIG<span className="text-accent-500">CHAMP</span>
            </NavLink>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User quick badge */}
          <div className="p-4 mx-3 my-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Account Status
              </span>
              {hasMembership ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  💎 Member
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                  Free Account
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 truncate mt-1">
              {user?.full_name || 'Champion'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email || user?.mobile}</p>

            {!hasMembership && (
              <Link
                to="/membership"
                className="mt-3 w-full py-1.5 px-3 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Card ₹100</span>
              </Link>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.locked) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={(e) => handleLockedClick(e, item.feature)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-800 text-sm">Dashboard</span>
          <div className="w-6" /> {/* spacer */}
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
