import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Package,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function EcommerceFooter() {
  const { getSiteContact } = useSettingsStore();
  const contact = getSiteContact();

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* 1. SHOPPING TRUST PILLARS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">100% Genuine Gear</h4>
              <p className="text-slate-400 text-xs mt-0.5">Coach-tested match willow & balls</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Free Insured Delivery</h4>
              <p className="text-slate-400 text-xs mt-0.5">On orders above ₹500 in India</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">7-Day Easy Exchange</h4>
              <p className="text-slate-400 text-xs mt-0.5">Size & spec replacement guarantee</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Dedicated Gear Support</h4>
              <p className="text-slate-400 text-xs mt-0.5">Advice from sporting specialists</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMMERCE NAVIGATION LINKS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Store Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo_emblem.png"
                alt="Bigchamp Winged Crest"
                className="h-9 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] shrink-0"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 font-display italic tracking-wider leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    BIGCHAMP
                  </span>
                  <span className="text-xs font-bold text-cyan-400 uppercase px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">
                    STORE
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400/80 uppercase tracking-widest font-mono">
                  India's Premier Sports Commerce Hub
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Certified match equipment, athletic footwear, and performance apparel delivered directly to tournament players and sports squads across India.
            </p>
            <div className="space-y-2 text-sm text-slate-400 pt-2 font-mono">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{contact.phone || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{contact.email || 'store@bigchamp.in'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{contact.address || 'BIGCHAMP Sports Arena, Bengaluru, India'}</span>
              </div>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4 text-cyan-400">
              Shop Gear & Apparel
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/store" className="hover:text-white transition-colors">
                  All Sports Products
                </Link>
              </li>
              <li>
                <Link to="/store?category=GEARS" className="hover:text-white transition-colors">
                  Cricket Willow & Balls
                </Link>
              </li>
              <li>
                <Link to="/store?category=APPAREL" className="hover:text-white transition-colors">
                  Jerseys & Activewear
                </Link>
              </li>
              <li>
                <Link to="/store?category=APPAREL" className="hover:text-white transition-colors">
                  Athletic Shoes & Spikes
                </Link>
              </li>
              <li>
                <Link to="/store?category=FITNESS" className="hover:text-white transition-colors">
                  Gym & Recovery Gear
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors">
                  <span>Hot Deals & Clearance</span>
                  <span className="text-[10px] bg-cyan-400 text-slate-950 px-1 rounded font-black">15% OFF</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4 text-slate-200">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/orders" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Track Your Order</span>
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Purchase
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* BigChamp Corporate Ecosystem Links */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-cyan-400 text-xs font-black tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>BigChamp Ecosystem</span>
              <ExternalLink className="w-3 h-3" />
            </h4>
            <p className="text-slate-400 text-xs mb-3">
              Beyond gear, BigChamp offers complete athletic infrastructure:
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium flex items-center gap-1">
                  <span>🏢 Main Brand Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/cookey" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium flex items-center gap-1">
                  <span>🍪 Cookey Nutrition</span>
                </Link>
              </li>
              <li>
                <Link to="/dormitory" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium flex items-center gap-1">
                  <span>🛏️ Sports Dormitory</span>
                </Link>
              </li>
              <li>
                <Link to="/physio" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium flex items-center gap-1">
                  <span>🩺 Sports Physio & Rehab</span>
                </Link>
              </li>
              <li>
                <Link to="/membership" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium flex items-center gap-1">
                  <span>🎟️ VIP Digital Pass</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT BADGES & COPYRIGHT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} BIGCHAMP Sports Store. All rights reserved. 100% Genuine Athletic Products.
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-[11px] font-semibold text-slate-500">Secure Payments:</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">UPI</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">RuPay</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">Visa / MC</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">NetBanking</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">COD</span>
        </div>
      </div>
    </footer>
  );
}

export default EcommerceFooter;
