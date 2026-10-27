import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  Globe,
  Bell,
  Sparkles,
  CreditCard,
  Package,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { MobileNav } from './MobileNav';

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguageStore();

  const { isAuthenticated, user, logout, fetchMe } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCount());

  useEffect(() => {
    // If authenticated but user data missing or stale in local storage, fetch me
    if (isAuthenticated && !user) {
      fetchMe();
    }
  }, [isAuthenticated, user, fetchMe]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { label: 'Store', to: '/store' },
    { label: 'Cookey', to: '/cookey' },
    { label: 'Dormitory', to: '/dormitory' },
    { label: 'Physio', to: '/physio' },
    { label: 'Membership', to: '/membership' },
  ];

  const hasMembership = user?.has_membership === true;

  return (
    <>
      {/* Top Luxury Announcement Bar */}
      <div className="bg-slate-950 text-slate-300 text-[11px] font-medium py-1.5 px-4 text-center border-b border-slate-800 tracking-wide">
        <span>Free standard delivery across India on orders above ₹500 &bull; 100% Genuine Match-Grade Guarantee</span>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-2xl font-black tracking-tight text-primary-900 group-hover:opacity-90 transition-opacity">
                  BIG<span className="text-accent-500">CHAMP</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-900 font-semibold bg-primary-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Shortcut Link */}
              <Link
                to="/store"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Search catalog"
                title="Search sports equipment catalog"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Language Selector Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors border border-slate-200 cursor-pointer"
                title="Switch Language / भाषा बदलें"
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5 text-primary-600" />
                <span className={language === 'en' ? 'font-bold text-primary-700' : 'text-slate-500'}>EN</span>
                <span className="text-slate-300">/</span>
                <span className={language === 'hi' ? 'font-bold text-primary-700' : 'text-slate-500'}>हिन्दी</span>
              </button>

              {/* Cart Icon with Counter */}
              <Link
                to="/cart"
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Auth Controls */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  {/* User Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-900 text-sm font-semibold transition-colors border border-slate-200"
                    aria-expanded={dropdownOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold">
                      {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[110px] truncate">
                      {user?.full_name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          Hi, {user?.full_name || 'Champion'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {user?.email || user?.mobile}
                        </p>
                        <div className="mt-2">
                          {hasMembership ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <span>💎</span> Member
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              Free Account
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1 text-sm font-medium text-slate-700">
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          to="/dashboard/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>My Orders</span>
                        </Link>

                        <Link
                          to="/dashboard/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Profile</span>
                        </Link>

                        {/* Member vs Free Card Upsell */}
                        {!hasMembership ? (
                          <Link
                            to="/membership"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 my-1 mx-2 rounded-xl bg-accent-50 text-accent-700 font-bold hover:bg-accent-100 transition-colors border border-accent-200"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-accent-600" />
                              <span>Get Card ₹100</span>
                            </span>
                            <span className="text-[10px] bg-accent-500 text-white px-2 py-0.5 rounded-full">
                              Upgrade
                            </span>
                          </Link>
                        ) : (
                          <Link
                            to="/dashboard/card"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                          >
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            <span>My Card</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg bg-primary-900 text-white text-sm font-medium hover:bg-primary-800 transition-colors shadow-xs"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
