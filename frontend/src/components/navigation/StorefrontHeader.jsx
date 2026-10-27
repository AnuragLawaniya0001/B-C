import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  CreditCard,
  Shield,
  Sparkles,
  ChevronDown,
  LogOut,
  Package,
  Layers,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Wallet,
  Ticket,
  Cookie,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';

export function StorefrontHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const { getBusinessRules, fetchSettings } = useSettingsStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle scroll detection for dynamic glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rules = getBusinessRules();
  const freeShippingThreshold = Math.round((rules.free_delivery_threshold_paise || 50000) / 100);
  const totalCartItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const isHomePage = location.pathname === '/';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/store');
    }
  };

  const navLinks = [
    { label: 'Store', path: '/store' },
    { label: 'Offers', path: '/offers', badge: '15% OFF' },
    { label: 'Membership', path: '/membership' },
    { label: 'Cookey', path: '/cookey' },
    { label: 'Army Offer', path: '/army-offer' },
    { label: 'Dormitory', path: '/dormitory' },
    { label: 'Physio', path: '/physio' },
    { label: 'About', path: '/about' },
  ];

  // News-ticker headlines running continuously from right to left
  const tickerItems = [
    {
      badge: 'OFFER',
      badgeColor: 'bg-accent-500 text-white',
      text: `Free Standard Insured Delivery on orders above ₹${freeShippingThreshold} across India!`,
      link: '/store',
      cta: 'Shop Now',
    },
    {
      badge: 'MEMBERSHIP',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      text: `VIP Membership: Flat ${rules.default_member_discount_percent || 15}% extra discount on all sports gear + priority Cookey drops!`,
      link: '/membership',
      cta: 'Join Privilege Club',
    },
    {
      badge: 'ARMED FORCES',
      badgeColor: 'bg-emerald-500 text-white',
      text: 'Dedicated concessional pricing for Indian Defense personnel and veterans.',
      link: '/army-offer',
      cta: 'Claim Defense Offer',
    },
    {
      badge: 'AUTHENTIC GEAR',
      badgeColor: 'bg-blue-500 text-white',
      text: 'Certified English Willow bats, FIFA-grade match balls & coach-tested tournament gear.',
      link: '/store',
      cta: 'Explore Catalog',
    },
    {
      badge: '7-DAY EXCHANGE',
      badgeColor: 'bg-purple-500 text-white',
      text: 'Hassle-free size and spec exchange across India on all performance footwear & apparel.',
      link: '/shipping-policy',
      cta: 'View Policy',
    },
    {
      badge: 'SPORTS REHAB',
      badgeColor: 'bg-rose-500 text-white',
      text: 'Professional athlete physiotherapy, fitness consultation, and sports dormitory booking.',
      link: '/physio',
      cta: 'Book Session',
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* =========================================================================
          NEWS HEADLINE TICKER (RUNNING RIGHT TO LEFT MARQUEE)
          ========================================================================= */}
      {showAnnouncement && (
        <div className="bg-slate-950/90 backdrop-blur-md text-white text-xs border-b border-white/10 relative overflow-hidden py-1.5 select-none transition-colors">
          <div className="flex items-center">
            {/* Ticker Lead Label (Like "BREAKING / LATEST") */}
            <div className="shrink-0 z-10 bg-slate-950/95 pl-4 pr-3 py-0.5 flex items-center gap-1.5 border-r border-white/10 shadow-md">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
              <span className="text-[10px] font-black tracking-widest text-accent-400 uppercase font-mono">
                LIVE
              </span>
            </div>

            {/* Seamless Infinite Marquee Ticker */}
            <div className="overflow-hidden whitespace-nowrap flex-1 relative flex">
              <div className="animate-ticker flex items-center py-0.5">
                {/* First Copy */}
                {tickerItems.map((item, idx) => (
                  <Link
                    key={`t1-${idx}`}
                    to={item.link}
                    className="inline-flex items-center gap-2 mx-6 group hover:text-accent-300 transition-colors cursor-pointer shrink-0"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                      {item.text}
                    </span>
                    <span className="text-[11px] font-bold text-accent-400 group-hover:underline inline-flex items-center gap-1">
                      {item.cta}{' '}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-slate-600 ml-4 font-serif text-sm">✦</span>
                  </Link>
                ))}

                {/* Second Identical Copy for Flawless Seamless Loop */}
                {tickerItems.map((item, idx) => (
                  <Link
                    key={`t2-${idx}`}
                    to={item.link}
                    className="inline-flex items-center gap-2 mx-6 group hover:text-accent-300 transition-colors cursor-pointer shrink-0"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                      {item.text}
                    </span>
                    <span className="text-[11px] font-bold text-accent-400 group-hover:underline inline-flex items-center gap-1">
                      {item.cta}{' '}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-slate-600 ml-4 font-serif text-sm">✦</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Dismiss Button */}
            <div className="shrink-0 z-10 bg-slate-950/95 px-3 py-0.5 border-l border-white/10 flex items-center">
              <button
                onClick={() => setShowAnnouncement(false)}
                className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                aria-label="Dismiss announcement ticker"
                title="Dismiss ticker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN NAVIGATION BAR (TRANSPARENT / DARK GLASSMORPHISM OVER VIDEO)
          ========================================================================= */}
      <div
        className={`transition-all duration-300 ${
          isHomePage && !isScrolled
            ? 'bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent'
            : 'bg-slate-950/92 backdrop-blur-md border-b border-slate-800/80 shadow-2xl'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Logo & Mobile Menu Trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-500 to-amber-500 flex items-center justify-center text-slate-950 font-black text-lg tracking-tight shadow-lg shadow-accent-500/25 group-hover:scale-105 transition-transform">
                  <span>BC</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-display leading-tight drop-shadow-sm">
                    BIG<span className="text-accent-400">CHAMP</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 -mt-0.5 hidden sm:block">
                    Sports & Wellness
                  </span>
                </div>
              </Link>
            </div>

            {/* Integrated Search Bar (Translucent Glass Input) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-md mx-4 relative"
            >
              <input
                type="text"
                placeholder="Search sports gear, apparel, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-400 focus:bg-slate-900/95 transition-all text-white placeholder-slate-400 shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
              {navLinks.slice(0, 6).map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'text-accent-400 bg-white/10 font-bold shadow-xs'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-accent-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons: Cart & Account */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search icon for mobile */}
              <Link
                to="/store"
                className="md:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Search catalog"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Cart Button */}
              <Link
                to="/cart"
                className="relative p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-6 h-6" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </span>
                )}
              </Link>

              {/* Customer Account / Login */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-500 text-slate-950 flex items-center justify-center font-black text-xs ring-2 ring-white/20">
                      {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-semibold text-slate-200 hidden sm:inline max-w-[100px] truncate">
                      {user?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
                  </button>

                  {/* Dropdown Menu - Modern Direct Customer Profile Hub */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/15 py-3 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                      {/* User Header Profile Card */}
                      <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-base ring-2 ring-white/20 shadow-md shrink-0">
                          {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-white truncate font-display">
                            {user?.full_name || 'Champion Athlete'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user?.email || user?.mobile}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {user?.has_membership ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active Member
                              </span>
                            ) : (
                              <Link
                                to="/membership"
                                onClick={() => setUserDropdownOpen(false)}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-900/60 transition-colors"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> Upgrade to Pass
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Direct Single Page Links with Rich Icons */}
                      <div className="py-2 px-2 space-y-0.5">
                        <Link
                          to="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">My Orders</span>
                              <span className="block text-[11px] text-slate-400 font-normal">Track active shipments & invoices</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/card"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">Digital Member Pass</span>
                              <span className="block text-[11px] text-slate-400 font-normal">QR pass, ID & club perks</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/wallet"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">Wallet & Cashback</span>
                              <span className="block text-[11px] text-slate-400 font-normal">Instant refunds & credits</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/coupons"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Ticket className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">Coupons & Vouchers</span>
                              <span className="block text-[11px] text-slate-400 font-normal">Promotions & active discounts</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">Profile & Addresses</span>
                              <span className="block text-[11px] text-slate-400 font-normal">Personal info & delivery details</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/cookey-tracker"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Cookie className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">Cookey Tracker</span>
                              <span className="block text-[11px] text-slate-400 font-normal">Weekly cooldown & lucky draws</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Settings className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold">Security & Settings</span>
                              <span className="block text-[11px] text-slate-400 font-normal">Password & preferences</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      </div>

                      {/* Sign Out Button */}
                      <div className="border-t border-white/10 mt-1 pt-1.5 px-2">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Sign Out Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-accent-500 to-amber-500 hover:from-accent-600 hover:to-amber-600 transition-all shadow-md shadow-accent-500/25 hover:scale-105 active:scale-95"
                  >
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Dark Glass Theme) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 text-white animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search gear, apparel, cookey..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-white placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  location.pathname === link.path
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30 font-bold'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="space-y-2 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white"
                  >
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    to="/card"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white"
                  >
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Digital Pass</span>
                  </Link>
                  <Link
                    to="/wallet"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white"
                  >
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>My Wallet</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white"
                  >
                    <User className="w-4 h-4 text-amber-400" />
                    <span>My Profile</span>
                  </Link>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  Sign Out Account
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  className="flex-1 py-2 text-center text-sm font-semibold border border-white/20 rounded-lg text-slate-200 hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 py-2 text-center text-sm font-bold bg-gradient-to-r from-accent-500 to-amber-500 text-white rounded-lg shadow-sm"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default StorefrontHeader;
