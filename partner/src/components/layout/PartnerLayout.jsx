import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { QrCode, LayoutDashboard, History, LogOut, Building2 } from 'lucide-react';
import { usePartnerAuthStore } from '../../store/partnerAuthStore';

export function PartnerLayout() {
  const { partnerUser, isAuthenticated, clearAuth, fetchMe } = usePartnerAuthStore();
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

  const navLinks = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan Member QR', to: '/scan', icon: QrCode },
    { label: 'History & Logs', to: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <span className="font-black text-xl tracking-wider text-white">
                BIG<span className="text-accent-500">CHAMP</span>
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded uppercase">
                Partner Portal
              </span>
            </NavLink>

            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-900 text-white font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-accent-500" />
              <span>{partnerUser?.name || 'Verified Partner Clinic / Dorm'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="sm:hidden flex border-t border-slate-800 px-2 py-1 justify-around bg-slate-950 text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-3 rounded text-[11px] font-medium ${
                    isActive ? 'text-accent-500 font-bold' : 'text-slate-400'
                  }`
                }
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
