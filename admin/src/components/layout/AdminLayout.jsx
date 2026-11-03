import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Navigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Package,
  ShoppingBag,
  Cookie,
  Trophy,
  Building2,
  BadgeDollarSign,
  Settings,
  Image,
  HelpCircle,
  Tag,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  X,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { adminUser, isAuthenticated, clearAuth, fetchMe } = useAdminAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated, fetchMe]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Storefront Merchandising', to: '/storefront-builder', icon: Layers },
    { label: 'Smart Popups', to: '/marketing-popups', icon: Sparkles },
    { label: 'Products & Store', to: '/products', icon: Package },
    { label: 'Offers & Coupons', to: '/coupons', icon: Tag },
    { label: 'Registered Users', to: '/users', icon: Users },
    { label: 'VIP Memberships', to: '/memberships', icon: ShieldCheck },
    { label: 'KYC Queue', to: '/kyc', icon: FileCheck2 },
    { label: 'Orders', to: '/orders', icon: ShoppingBag },
    { label: 'Payments', to: '/payments', icon: CreditCard },
    { label: 'Cookey Buyers', to: '/cookey', icon: Cookie },
    { label: 'Lucky Draw', to: '/lucky-draw', icon: Trophy },
    { label: 'Partners', to: '/partners', icon: Building2 },
    { label: 'Finance & Wallet', to: '/finance', icon: BadgeDollarSign },
    { label: 'Banners', to: '/banners', icon: Image },
    { label: 'FAQs', to: '/faqs', icon: HelpCircle },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#02050b] text-slate-100 flex relative selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Background Ambience & Radial Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0a152e]/40 via-[#02050b] to-[#010307]" />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#060b16]/95 backdrop-blur-2xl border-r border-white/10 text-slate-300 transition-all duration-300 ease-in-out lg:static flex flex-col justify-between shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
            {!collapsed ? (
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <img
                  src="/assets/logo.png"
                  alt="Bigchamp Crest"
                  className="h-6 w-auto filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <span className="font-syne font-black text-sm tracking-wider text-white">
                    BIG<span className="text-amber-400">CHAMP</span>
                  </span>
                  <span className="px-1 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[8px] font-black uppercase tracking-wider shrink-0">
                    ADMIN
                  </span>
                </div>
              </Link>
            ) : (
              <Link to="/dashboard" className="mx-auto">
                <img
                  src="/assets/logo.png"
                  alt="Bigchamp Crest"
                  className="h-8 w-auto filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] hover:scale-105 transition-transform"
                />
              </Link>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Scrollable) */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-l-2 border-amber-400 text-amber-300 shadow-[inset_0_0_15px_rgba(245,158,11,0.08)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer / Logout */}
          <div className="p-3 border-t border-white/10 shrink-0">
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors cursor-pointer ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Bar */}
        <header className="h-16 bg-[#060b16]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-syne font-bold text-white tracking-wide">Operations Portal</h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM LIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Storefront Link */}
            <a
              href="http://localhost:3000/store"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Visit Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Notification Bell */}
            <div className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
            </div>

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs uppercase shadow-md shadow-amber-500/20">
                {(adminUser?.full_name || adminUser?.name || 'AD').slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {adminUser?.full_name || adminUser?.name || 'Super Admin'}
                </p>
                <p className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
                  {adminUser?.role || 'SUPER_ADMIN'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
