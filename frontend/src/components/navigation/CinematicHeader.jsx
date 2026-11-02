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
  Heart,
  Flame,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export function CinematicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const megaMenuRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const totalCartItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bc_wishlist') || '[]');
      setWishlistCount(saved.length);
    } catch (e) {}
  }, [location.pathname]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setMegaMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setMegaMenuOpen(false);
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

  const categories = [
    { name: 'Cricket & Willow', slug: 'GEARS', icon: '🏏', desc: 'English Willow bats, leather balls & pads' },
    { name: 'Apparel & Footwear', slug: 'APPAREL', icon: '👟', desc: 'Running spikes, team jerseys & tracksuits' },
    { name: 'Gym & Fitness', slug: 'FITNESS', icon: '🏋️', desc: 'Dumbbells, eco mats, skipping ropes' },
    { name: 'VIP Pass & Exclusives', slug: 'EXCLUSIVE', icon: '🎟️', desc: 'Member passes & Cookey tokens' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
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

              <Link to="/store" className="flex items-center gap-3 group">
                <img
                  src="/assets/logo_emblem.png"
                  alt="Bigchamp Winged Crest"
                  className="h-9 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform shrink-0"
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
            <nav className="hidden lg:flex items-center space-x-1">
              <Link
                to="/store"
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                All Products
              </Link>

              {/* Categories Dropdown Mega Menu */}
              <div className="relative" ref={megaMenuRef}>
                <button
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                </button>

                {megaMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-white/15 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 px-3 py-1.5 border-b border-white/10 mb-1">
                      Shop Disciplines
                    </div>
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/store?category=${cat.slug}`}
                        onClick={() => setMegaMenuOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                      >
                        <span className="text-xl p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {cat.desc}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/offers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
              >
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>Deals &bull; 15% Off</span>
              </Link>

              <Link
                to="/membership"
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                VIP Pass
              </Link>

              <Link
                to="/"
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <span>Main Hub</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </nav>

            {/* Right: Essential Shopping Actions (Search, Wishlist, Cart, Profile) */}
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

              {/* Wishlist Link */}
              <Link
                to="/store"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

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

              {/* Account Dropdown */}
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
        <div className="lg:hidden bg-slate-950/98 backdrop-blur-2xl border-b border-white/10 p-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            <Link
              to="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-white hover:text-cyan-400 rounded-lg hover:bg-white/5"
            >
              All Products
            </Link>
            <div className="pl-3 py-1 space-y-1">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/store?category=${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-white py-1"
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/offers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-cyan-400 rounded-lg hover:bg-white/5"
            >
              Hot Deals (15% OFF)
            </Link>
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
            >
              VIP Pass
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              Main Brand Hub
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default CinematicHeader;
