import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  FileText,
  Image,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { adminUser, clearAuth } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Users & Members', to: '/users', icon: Users },
    { label: 'KYC Queue', to: '/kyc', icon: FileCheck2 },
    { label: 'Products & Store', to: '/products', icon: Package },
    { label: 'Orders', to: '/orders', icon: ShoppingBag },
    { label: 'Cookey Buyers', to: '/cookey', icon: Cookie },
    { label: 'Lucky Draw', to: '/lucky-draw', icon: Trophy },
    { label: 'Partners', to: '/partners', icon: Building2 },
    { label: 'Finance & Wallet', to: '/finance', icon: BadgeDollarSign },
    { label: 'CMS Pages', to: '/pages', icon: FileText },
    { label: 'Banners', to: '/banners', icon: Image },
    { label: 'FAQs', to: '/faqs', icon: HelpCircle },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 transition-all duration-200 ease-in-out lg:static flex flex-col justify-between ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
            {!collapsed && (
              <span className="font-black text-lg tracking-wider text-white">
                BIGCHAMP <span className="text-accent-500 text-xs px-2 py-0.5 rounded bg-accent-950 font-semibold uppercase">ADMIN</span>
              </span>
            )}
            {collapsed && (
              <span className="font-black text-lg text-accent-500 mx-auto">BC</span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-slate-800">Operations Portal</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
            </div>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800">Admin User</p>
                <p className="text-[10px] text-slate-500">Super Administrator</p>
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
