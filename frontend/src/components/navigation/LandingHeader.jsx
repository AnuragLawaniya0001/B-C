import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingBag,
  CreditCard,
  Building2,
  Activity,
  Phone,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export function LandingHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { items } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartCount = items.reduce((total, item) => total + (item.qty || item.quantity || 1), 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 sm:py-4">
      <nav
        className={`max-w-6xl mx-auto rounded-full px-5 py-2.5 transition-all duration-300 flex items-center justify-between gap-4 border ${
          isScrolled
            ? 'bg-[#040812]/92 backdrop-blur-2xl border-white/15 shadow-2xl'
            : 'bg-[#040812]/75 backdrop-blur-xl border-white/10 shadow-lg'
        }`}
      >
        {/* Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/assets/logo_emblem.png"
            alt="Bigchamp Winged Crest"
            className="h-8 sm:h-9 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-syne font-black text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 leading-none italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              BIGCHAMP
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono tracking-[1.5px] uppercase text-cyan-400 mt-0.5 font-bold">
              Born to Win
            </span>
          </div>
        </Link>

        {/* Center 5 Links (Store, Hostels, Physio, Membership, Contact) */}
        <ul className="hidden md:flex items-center gap-6 lg:gap-8 list-none text-xs tracking-[1.5px] uppercase font-bold text-slate-300 shrink-0">
          <li>
            <Link
              to="/store"
              className="text-cyan-400 hover:text-white transition-colors flex items-center gap-1.5 font-extrabold"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Store</span>
            </Link>
          </li>
          <li>
            <Link
              to="/dormitory"
              className={`hover:text-cyan-400 transition-colors ${
                location.pathname === '/dormitory' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Hostels
            </Link>
          </li>
          <li>
            <Link
              to="/physio"
              className={`hover:text-cyan-400 transition-colors ${
                location.pathname === '/physio' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Physio
            </Link>
          </li>
          <li>
            <Link
              to="/membership"
              className={`hover:text-cyan-400 transition-colors ${
                location.pathname === '/membership' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Membership
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={`hover:text-cyan-400 transition-colors ${
                location.pathname === '/contact' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Action Hub (Live Cart, Cyan Join Pass CTA, Auth, Mobile Toggle) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Live Cart Pill */}
          <Link
            to="/cart"
            className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-all flex items-center justify-center group"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[10px] flex items-center justify-center px-1 shadow-md shadow-cyan-500/40">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Cyan Join Pass CTA (Hidden on mobile) */}
          <Link
            to="/membership"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-syne font-black text-[11px] uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Join ₹100 Pass</span>
          </Link>

          {/* User Auth Portal */}
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:scale-105 transition-transform"
              title="Go to Dashboard"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-[10px]">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <span className="hidden xl:inline text-[11px]">{user?.full_name?.split(' ')[0] || 'User'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors hidden lg:inline ${
                location.pathname === '/login'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Glass Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-8 pt-24 animate-in fade-in duration-200">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col gap-5 text-center text-base font-syne font-black uppercase tracking-widest text-slate-200">
            <Link
              to="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-400 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Official Sports Store</span>
            </Link>
            <Link
              to="/dormitory"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Athlete Hostels
            </Link>
            <Link
              to="/physio"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Sports Physio
            </Link>
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-cyan-400"
            >
              ₹100 VIP Athlete Pass
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-cyan-400"
            >
              Contact Us
            </Link>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/10">
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center py-3 px-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-syne font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 w-full text-center"
            >
              Join ₹100 Pass 🎖️
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-wider"
            >
              {isAuthenticated ? 'My Dashboard' : 'Sign In / Register'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingHeader;
