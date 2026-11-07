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
  ChevronRight,
  LogOut,
  Package,
  Flame,
  Trophy,
  Shirt,
  Dumbbell,
  Target,
  Boxes,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

const getCategoryMeta = (cat = {}) => {
  const name = String(cat.name || cat.slug || '').toUpperCase();

  if (name.includes('GEAR') || name.includes('CRICKET')) {
    return {
      title: 'Sports Gear & Match Willow',
      desc: cat.description && !cat.description.toLowerCase().includes('category')
        ? cat.description
        : 'English willow bats, tournament balls & armor',
      icon: Trophy,
      badge: 'PRO',
      iconBg: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
    };
  }
  if (name.includes('APPAREL') || name.includes('CLOTH') || name.includes('JERSEY') || name.includes('SHOE')) {
    return {
      title: 'Apparel & Performance Wear',
      desc: cat.description && !cat.description.toLowerCase().includes('category')
        ? cat.description
        : 'DryFit team jerseys, tracksuits & athletic spikes',
      icon: Shirt,
      badge: 'MATCH',
      iconBg: 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300',
    };
  }
  if (name.includes('FITNESS') || name.includes('GYM') || name.includes('WORKOUT')) {
    return {
      title: 'Fitness & Athlete Conditioning',
      desc: cat.description && !cat.description.toLowerCase().includes('category')
        ? cat.description
        : 'Dumbbells, speed bearing ropes & eco grip mats',
      icon: Dumbbell,
      badge: 'ELITE',
      iconBg: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
    };
  }
  if (name.includes('EQUIP') || name.includes('BALL') || name.includes('FOOTBALL')) {
    return {
      title: 'Field Equipment & Training',
      desc: cat.description && !cat.description.toLowerCase().includes('category')
        ? cat.description
        : 'FIFA match balls, speed ladders & training kits',
      icon: Target,
      badge: 'FIELD',
      iconBg: 'bg-indigo-400/10 border-indigo-400/30 text-indigo-300',
    };
  }
  return {
    title: cat.name || cat.slug || 'Athletic Discipline',
    desc: cat.description || 'Championship-grade athletic equipment',
    icon: Boxes,
    badge: null,
    iconBg: 'bg-slate-700/20 border-slate-600/30 text-slate-300',
  };
};

export function CinematicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const catMenuRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatExpanded, setMobileCatExpanded] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const totalCartItems = items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real dynamic categories from admin product categories API
  useEffect(() => {
    let isMounted = true;
    api
      .get('/categories')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          const activeCats = res.data.filter((c) => c.active !== false);
          setCategories(activeCats.length > 0 ? activeCats : res.data);
        }
      })
      .catch((err) => {
        console.error('Header failed to load dynamic categories:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchOpen(false);
    setCatMenuOpen(false);
    setMobileCatExpanded(false);
  }, [location.pathname, location.search]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(event.target)) {
        setCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans">
      {/* Sleek, Clean Master Commerce Navigation Bar */}
      <div
        className={`transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-slate-950/95 backdrop-blur-2xl border-white/10 shadow-2xl'
            : 'bg-slate-950/80 backdrop-blur-xl border-white/10 shadow-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Left: Brand Logo & Wordmark */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link to="/" className="flex items-center gap-3 group">
                <img
                  src="/assets/logo_emblem.png"
                  alt="Bigchamp Winged Crest"
                  className="h-9 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/logo.png';
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 font-display leading-tight italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    BIGCHAMP
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-400 -mt-0.5 hidden sm:block font-bold">
                    Sports Commerce
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Clean Store Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 sm:space-x-1.5">
              <Link
                to="/store"
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                  location.pathname === '/store' && !location.search.includes('category=')
                    ? 'text-cyan-400 bg-white/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Store
              </Link>

              {/* Dynamic Product Categories Dropdown (Fetched from Admin / Products API) */}
              <div className="relative" ref={catMenuRef}>
                <button
                  type="button"
                  onClick={() => setCatMenuOpen(!catMenuOpen)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
                    catMenuOpen || (location.pathname === '/store' && location.search.includes('category='))
                      ? 'text-cyan-400 bg-white/5'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                </button>

                {catMenuOpen && (
                  <div className="absolute top-full left-0 mt-3 w-[540px] bg-[#060b17] rounded-2xl border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.95)] z-[100] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                    {/* Top Bar: Clean Disciplines Title & Count */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a1022]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,1)]" />
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-200 font-bold">
                          Sports Disciplines &amp; Catalog
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                        {categories.length} Verified Disciplines
                      </span>
                    </div>

                    {/* 2-Column Responsive Category Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3 bg-[#060b17]">
                      {categories.map((cat) => {
                        const catName = cat.name || cat.slug || 'Category';
                        const meta = getCategoryMeta(cat);
                        const IconComp = meta.icon;
                        const itemCount = cat.product_count;
                        return (
                          <Link
                            key={cat._id || cat.slug || catName}
                            to={`/store?category=${encodeURIComponent(catName)}`}
                            onClick={() => setCatMenuOpen(false)}
                            className="group flex flex-col justify-between p-3.5 rounded-xl bg-[#0d1629] hover:bg-[#13203c] border border-white/10 hover:border-cyan-400/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-transform duration-200 group-hover:scale-110 ${meta.iconBg}`}>
                                  <IconComp className="w-4 h-4" strokeWidth={2.2} />
                                </div>
                                {meta.badge && (
                                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10 tracking-widest">
                                    {meta.badge}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors uppercase tracking-wider font-display">
                                  {catName}
                                </div>
                                <div className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mt-1">
                                  {meta.desc}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-[11px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                              <span className="font-medium">
                                {typeof itemCount === 'number' && itemCount > 0
                                  ? `${itemCount} Pro Items`
                                  : 'Tournament Grade'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-[#030712] border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>100% Match Grade &amp; Coach Tested</span>
                      </div>
                      <Link
                        to="/store"
                        onClick={() => setCatMenuOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider font-mono group"
                      >
                        <span>Explore Full Store</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/dormitory"
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                  location.pathname === '/dormitory'
                    ? 'text-cyan-400 bg-white/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Stays
              </Link>

              <Link
                to="/physio"
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                  location.pathname === '/physio'
                    ? 'text-cyan-400 bg-white/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Medical
              </Link>

              <Link
                to="/offers"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                  location.pathname === '/offers'
                    ? 'text-cyan-300 bg-cyan-400/20'
                    : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>Offers</span>
              </Link>

              <Link
                to="/membership"
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
                  location.pathname === '/membership'
                    ? 'text-cyan-400 bg-white/5'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Membership
              </Link>
            </nav>

            {/* Right: Essential Shopping Actions (Search, Cart, Profile) */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {/* Expandable Search Input */}
              {searchOpen ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center animate-in fade-in zoom-in-95"
                >
                  <input
                    type="text"
                    placeholder="Search gear, bats, apparel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-40 sm:w-60 pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-cyan-400/50 rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Shopping Cart Button */}
              <Link
                to="/cart"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </span>
                )}
              </Link>

              {/* Account Dropdown / Sign In Button */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center">
                      {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-white/15 p-2 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95">
                      <div className="p-3 border-b border-white/10">
                        <div className="font-bold text-white truncate font-display">
                          {user?.full_name || 'Champion Athlete'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {user?.email || user?.mobile}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-medium"
                        >
                          <Package className="w-4 h-4 text-cyan-400" />
                          <span>My Orders &amp; Tracking</span>
                        </Link>
                        <Link
                          to="/card"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-medium"
                        >
                          <CreditCard className="w-4 h-4 text-cyan-400" />
                          <span>Digital Member Pass</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 font-medium"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Account</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-white/10">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-medium transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 backdrop-blur-2xl border-b border-white/10 p-5 space-y-2 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            <Link
              to="/store"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                location.pathname === '/store' && !location.search.includes('category=')
                  ? 'text-cyan-400 bg-white/10'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              Store
            </Link>

            {/* Dynamic Product Categories in Mobile Menu */}
            <div className="py-0.5">
              <button
                type="button"
                onClick={() => setMobileCatExpanded(!mobileCatExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-200 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <span>Product Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileCatExpanded ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
              </button>
              {mobileCatExpanded && (
                <div className="pl-2 pr-2 py-2 space-y-1 mt-1 bg-white/[0.03] rounded-xl border border-white/10">
                  {categories.map((cat) => {
                    const catName = cat.name || cat.slug;
                    const meta = getCategoryMeta(cat);
                    const IconComp = meta.icon;
                    return (
                      <Link
                        key={cat._id || catName}
                        to={`/store?category=${encodeURIComponent(catName)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${meta.iconBg}`}>
                            <IconComp className="w-3.5 h-3.5" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold uppercase tracking-wider text-white group-hover:text-cyan-300 block truncate">
                              {catName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {meta.desc}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                      </Link>
                    );
                  })}
                  <Link
                    to="/store"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-cyan-400 hover:text-cyan-300 py-2 pt-2.5 font-mono uppercase tracking-wider border-t border-white/5"
                  >
                    <span>View All Gear</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/dormitory"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                location.pathname === '/dormitory'
                  ? 'text-cyan-400 bg-white/10'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              Stays
            </Link>
            <Link
              to="/physio"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                location.pathname === '/physio'
                  ? 'text-cyan-400 bg-white/10'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              Medical
            </Link>
            <Link
              to="/offers"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                location.pathname === '/offers'
                  ? 'text-cyan-300 bg-cyan-400/20'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4 animate-pulse" />
              <span>Offers</span>
            </Link>
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                location.pathname === '/membership'
                  ? 'text-cyan-400 bg-white/10'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              Membership
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default CinematicHeader;
