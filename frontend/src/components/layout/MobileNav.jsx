import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  X,
  ShoppingBag,
  User,
  LogIn,
  LogOut,
  LayoutDashboard,
  Package,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export function MobileNav({ isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCount());
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { label: 'Store', to: '/store' },
    { label: 'Cookey', to: '/cookey' },
    { label: 'Dormitory', to: '/dormitory' },
    { label: 'Physio', to: '/physio' },
    { label: 'Membership Card', to: '/membership' },
    { label: 'Army Offer', to: '/army-offer' },
  ];

  const hasMembership = user?.has_membership === true;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl p-6 flex flex-col justify-between z-10 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200">
            <Link to="/" onClick={onClose} className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-primary-900">
                BIG<span className="text-accent-500">CHAMP</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card (if logged in) */}
          {isAuthenticated && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.full_name || 'Champion'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.email || user?.mobile}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                {hasMembership ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span>💎</span> Member
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                    Free Account
                  </span>
                )}
                {!hasMembership && (
                  <Link
                    to="/membership"
                    onClick={onClose}
                    className="text-[11px] font-bold text-accent-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Get Card ₹100</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mt-4 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated && (
              <>
                <div className="pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                  My Account
                </div>
                <NavLink
                  to="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink
                  to="/dashboard/orders"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>My Orders</span>
                </NavLink>
                <NavLink
                  to="/dashboard/profile"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-200 space-y-3">
          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 text-slate-800 font-medium text-sm hover:bg-slate-100"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent-500" />
              <span>Cart</span>
            </span>
            <span className="bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {cartCount}
            </span>
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-900 text-white font-medium text-sm hover:bg-primary-800 shadow-xs"
              >
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
