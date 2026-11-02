import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  CreditCard,
  ChevronDown,
  LogOut,
  Package,
  ArrowRight,
  Flame,
  Wallet,
  Ticket,
  ExternalLink,
  Building2,
  Heart,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';

export function EcommerceHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const hubDropdownRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const { getBusinessRules, fetchSettings } = useSettingsStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('ALL');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Scroll detection for navbar glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setHubDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (hubDropdownRef.current && !hubDropdownRef.current.contains(event.target)) {
        setHubDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rules = getBusinessRules();
  const freeShippingThreshold = Math.round((rules.free_delivery_threshold_paise || 50000) / 100);
  const totalCartItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (selectedSearchCategory && selectedSearchCategory !== 'ALL') {
      params.set('category', selectedSearchCategory);
    }
    navigate(`/store?${params.toString()}`);
  };

  // Pure E-Commerce Category Navigation Links
  const storeCategories = [
    { label: 'All Products', path: '/store', icon: '🛍️' },
    { label: 'Cricket Gear', path: '/store?category=GEARS', icon: '🏏' },
    { label: 'Football & Sports', path: '/store?category=GEARS', icon: '⚽' },
    { label: 'Gym & Fitness', path: '/store?category=FITNESS', icon: '🏋️' },
    { label: 'Footwear & Spikes', path: '/store?category=APPAREL', icon: '👟' },
    { label: 'Athletic Apparel', path: '/store?category=APPAREL', icon: '👕' },
    { label: 'Offers & Deals', path: '/offers', badge: '15% OFF', isOffer: true },
  ];

  // News-ticker for E-Commerce promotions
  const tickerItems = [
    {
      badge: 'FREE DELIVERY',
      badgeColor: 'bg-emerald-500 text-white',
      text: `Free Insured Nationwide Delivery on all sports orders above ₹${freeShippingThreshold}!`,
      link: '/store',
      cta: 'Shop Now',
    },
    {
      badge: '100% GENUINE',
      badgeColor: 'bg-blue-500 text-white',
      text: 'Match-grade certified cricket willow, FIFA-grade balls & coach-tested tournament gear.',
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
      badge: 'VIP SAVINGS',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      text: `Members get flat ${rules.default_member_discount_percent || 15}% extra off on all sports gear!`,
      link: '/membership',
      cta: 'Get Pass',
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* 1. TOP ANNOUNCEMENT TICKER WITH HUB SWITCH */}
      {showAnnouncement && (
        <div className="bg-slate-950 text-white text-xs border-b border-slate-800 relative overflow-hidden py-1.5 select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Infinite Marquee Ticker */}
            <div className="flex items-center flex-1 overflow-hidden">
              <div className="shrink-0 bg-slate-900 px-2 py-0.5 rounded text-[10px] font-black tracking-widest text-amber-400 uppercase mr-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                OFFICIAL STORE
              </div>

              <div className="overflow-hidden whitespace-nowrap relative flex-1">
                <div className="animate-ticker flex items-center">
                  {tickerItems.map((item, idx) => (
                    <Link
                      key={`t1-${idx}`}
                      to={item.link}
                      className="inline-flex items-center gap-2 mx-6 group hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                        {item.text}
                      </span>
                      <span className="text-[11px] font-bold text-amber-400 group-hover:underline inline-flex items-center gap-1">
                        {item.cta} <ArrowRight className="w-3 h-3" />
                      </span>
                      <span className="text-slate-600 ml-4 font-serif text-sm">✦</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Hub Switcher (Clear separation: Link back to BigChamp Corporate Hub) */}
            <div className="shrink-0 flex items-center gap-2 text-xs">
              <div className="relative" ref={hubDropdownRef}>
                <button
                  onClick={() => setHubDropdownOpen(!hubDropdownOpen)}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 text-[11px] font-semibold border border-slate-700/60 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-amber-400" />
                  <span>BigChamp Hub</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {hubDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                      BigChamp Ecosystem Services
                    </div>
                    <Link
                      to="/"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <span className="text-sm">🏠</span>
                      <div>
                        <div className="font-bold">Main Landing Hub</div>
                        <div className="text-[10px] text-slate-400">About BigChamp ecosystem</div>
                      </div>
                    </Link>
                    <Link
                      to="/cookey"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <span className="text-sm">🍪</span>
                      <div>
                        <div className="font-bold">Cookey Nutrition</div>
                        <div className="text-[10px] text-slate-400">Athlete meal prep & lucky draw</div>
                      </div>
                    </Link>
                    <Link
                      to="/dormitory"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <span className="text-sm">🛏️</span>
                      <div>
                        <div className="font-bold">Athlete Dormitory</div>
                        <div className="text-[10px] text-slate-400">Sports hostel & accommodation</div>
                      </div>
                    </Link>
                    <Link
                      to="/physio"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <span className="text-sm">🩺</span>
                      <div>
                        <div className="font-bold">Physio & Rehab</div>
                        <div className="text-[10px] text-slate-400">Sports injury & therapy clinics</div>
                      </div>
                    </Link>
                    <Link
                      to="/membership"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <span className="text-sm">🎟️</span>
                      <div>
                        <div className="font-bold">VIP Membership</div>
                        <div className="text-[10px] text-slate-400">Digital athlete pass & perks</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Dismiss Ticker */}
              <button
                onClick={() => setShowAnnouncement(false)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN E-COMMERCE SHOPPING BAR */}
      <div
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-2xl'
            : 'bg-slate-950 border-b border-slate-800/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            {/* Storefront Logo & Mobile Nav Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 focus:outline-none cursor-pointer"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/store" className="flex items-center gap-3 group">
                <img
                  src="/assets/logo_emblem.png"
                  alt="Bigchamp Brand Crest"
                  className="h-8 sm:h-9 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 font-display leading-tight italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      BIGCHAMP
                    </span>
                    <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 text-[9px] font-black uppercase px-1.5 py-0.2 rounded tracking-wider">
                      STORE
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80 -mt-0.5 hidden sm:block">
                    Sports & Athletic Gear
                  </span>
                </div>
              </Link>
            </div>

            {/* E-Commerce Search Input with Category Selector */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-xl relative items-center"
            >
              <div className="w-full flex items-center bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 shadow-inner">
                {/* Category Selector Dropdown */}
                <select
                  value={selectedSearchCategory}
                  onChange={(e) => setSelectedSearchCategory(e.target.value)}
                  className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-2.5 border-r border-slate-700 outline-none cursor-pointer hover:bg-slate-700/80 transition-colors shrink-0"
                >
                  <option value="ALL">All Categories</option>
                  <option value="GEARS">Cricket & Sports</option>
                  <option value="APPAREL">Apparel & Shoes</option>
                  <option value="FITNESS">Gym & Fitness</option>
                  <option value="EXCLUSIVE">Exclusive Passes</option>
                </select>

                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    placeholder="Search cricket bats, footballs, gym wear, shoes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-transparent text-white placeholder-slate-400 outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Right Action Icons: Offers, Cart, Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile Search Button */}
              <Link
                to="/store"
                className="md:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Search catalog"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Offers link */}
              <Link
                to="/offers"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
              >
                <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Deals</span>
                <span className="bg-cyan-400 text-slate-950 text-[9px] font-black px-1 rounded-sm">
                  15% OFF
                </span>
              </Link>

              {/* Shopping Cart Button */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2 group cursor-pointer shadow-sm"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline text-xs font-bold text-slate-200">Cart</span>
                {totalCartItems > 0 && (
                  <span className="bg-cyan-400 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </span>
                )}
              </Link>

              {/* Customer Account / Sign In */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors focus:outline-none cursor-pointer"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                      {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[90px] truncate">
                      {user?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  </button>

                  {/* Customer Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 py-2.5 z-50 text-white animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                          {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">
                            {user?.full_name || 'Champion Athlete'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user?.email || user?.mobile}
                          </p>
                        </div>
                      </div>

                      <div className="py-1 px-1.5 space-y-0.5 text-xs">
                        <Link
                          to="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                          <Package className="w-4 h-4 text-blue-400" />
                          <span>My Orders & Tracking</span>
                        </Link>
                        <Link
                          to="/card"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span>Digital Member Pass</span>
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                          <Wallet className="w-4 h-4 text-emerald-400" />
                          <span>Wallet & Cashback</span>
                        </Link>
                        <Link
                          to="/coupons"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                          <Ticket className="w-4 h-4 text-purple-400" />
                          <span>Coupons & Vouchers</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Profile & Addresses</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-800 pt-1 mt-1 px-1.5">
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            await logout();
                            navigate('/store');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-black bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. DEDICATED E-COMMERCE CATEGORY BAR (SUBNAV) */}
        <div className="border-t border-slate-800/80 bg-slate-950/90 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between py-2 text-xs">
              <div className="flex items-center space-x-1 xl:space-x-2">
                {storeCategories.map((cat, idx) => {
                  const isActive = location.pathname + location.search === cat.path;
                  return (
                    <Link
                      key={idx}
                      to={cat.path}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        cat.isOffer
                          ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 font-bold'
                          : isActive
                          ? 'text-cyan-400 bg-slate-800 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.label}</span>
                      {cat.badge && (
                        <span className="bg-cyan-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                          {cat.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Fast links */}
              <div className="flex items-center gap-4 text-slate-400">
                <Link to="/orders" className="hover:text-amber-400 transition-colors flex items-center gap-1 font-medium">
                  <Package className="w-3.5 h-3.5" /> Track Order
                </Link>
                <Link to="/contact" className="hover:text-amber-400 transition-colors font-medium">
                  Help / Support
                </Link>
                <Link to="/" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px] font-semibold border-l border-slate-800 pl-3">
                  <span>BigChamp Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3 text-white animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search gear, apparel, bats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* E-Commerce Categories */}
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
            Shop by Category
          </div>
          <div className="grid grid-cols-2 gap-2">
            {storeCategories.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.path}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200"
              >
                <span>{cat.icon || '🔥'}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>

          {/* Jump to Corporate Hub */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
              Other BigChamp Services
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/" className="p-2 rounded bg-slate-900/60 text-slate-300 hover:text-white">
                🏠 Main Hub
              </Link>
              <Link to="/cookey" className="p-2 rounded bg-slate-900/60 text-slate-300 hover:text-white">
                🍪 Cookey Nutrition
              </Link>
              <Link to="/dormitory" className="p-2 rounded bg-slate-900/60 text-slate-300 hover:text-white">
                🛏️ Dormitory
              </Link>
              <Link to="/physio" className="p-2 rounded bg-slate-900/60 text-slate-300 hover:text-white">
                🩺 Physio Clinic
              </Link>
              <Link to="/membership" className="p-2 rounded bg-slate-900/60 text-slate-300 hover:text-white">
                🎟️ Membership Pass
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default EcommerceHeader;

