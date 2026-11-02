import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ExternalLink, Instagram, Youtube, Facebook, Twitter, Package } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function CinematicFooter() {
  const { getSiteContact, settings } = useSettingsStore();
  const contact = getSiteContact();
  const social = settings?.social_links || {};

  return (
    <footer className="w-full bg-black text-slate-400 pt-16 pb-12 border-t border-white/10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top: Brand & Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo_emblem.png"
                alt="Bigchamp Winged Crest"
                className="h-10 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 font-display leading-tight italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  BIGCHAMP
                </span>
                <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-400 -mt-0.5 font-bold">
                  Sports Commerce &bull; Birth of a Legend
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Handcrafted English Willow cricket bats, FIFA-grade tournament balls, high-velocity running footwear, and athletic activewear engineered for champions across India.
            </p>

            {/* Dynamic Contact Details */}
            <div className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{contact.phone || '+91 90000 00000'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{contact.email || 'support@bigchamp.in'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{contact.address || 'BIGCHAMP Sports Arena, India'}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Disciplines */}
          <div>
            <h4 className="text-white text-xs font-mono font-bold tracking-widest uppercase mb-4 text-cyan-400">
              Shop Categories
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/store" className="hover:text-white transition-colors">
                  All Sports Equipment
                </Link>
              </li>
              <li>
                <Link to="/store?category=GEARS" className="hover:text-white transition-colors">
                  Cricket Bats & Leather Balls
                </Link>
              </li>
              <li>
                <Link to="/store?category=APPAREL" className="hover:text-white transition-colors">
                  Running Spikes & Footwear
                </Link>
              </li>
              <li>
                <Link to="/store?category=APPAREL" className="hover:text-white transition-colors">
                  Team Jerseys & Activewear
                </Link>
              </li>
              <li>
                <Link to="/store?category=FITNESS" className="hover:text-white transition-colors">
                  Gym & Recovery Mats
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-cyan-400 font-bold hover:underline">
                  Clearance Deals (15% Off)
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white text-xs font-mono font-bold tracking-widest uppercase mb-4 text-slate-200">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/orders" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Track Order Shipment</span>
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">
                  7-Day Return Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Specialist Care
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Corporate Hub Links */}
          <div>
            <h4 className="text-white text-xs font-mono font-bold tracking-widest uppercase mb-4 text-slate-200">
              BigChamp Platform
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/" className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                  <span>Main Brand Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-white transition-colors">
                  VIP Athlete Pass
                </Link>
              </li>
              <li>
                <Link to="/cookey" className="hover:text-white transition-colors">
                  Cookey Meal Prep
                </Link>
              </li>
              <li>
                <Link to="/dormitory" className="hover:text-white transition-colors">
                  Athlete Dormitories
                </Link>
              </li>
              <li>
                <Link to="/physio" className="hover:text-white transition-colors">
                  Sports Physiotherapy
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About BIGCHAMP
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom: Copyright & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} BIGCHAMP Sports & Commerce. All rights reserved. English Willow & Match-Grade Equipment.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-400">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link to="/shipping-policy" className="hover:text-slate-400">Shipping</Link>
            <Link to="/refund-policy" className="hover:text-slate-400">Exchange</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default CinematicFooter;

