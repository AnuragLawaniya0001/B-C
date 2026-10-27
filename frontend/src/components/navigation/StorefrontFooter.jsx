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
  Heart,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function StorefrontFooter() {
  const { getSiteContact, settings } = useSettingsStore();
  const contact = getSiteContact();
  const socialLinks = settings?.social_links || {};

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Trust Badges Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-800/60 flex items-center justify-center shrink-0 text-accent-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">100% Genuine Gear</h4>
              <p className="text-slate-400 text-xs mt-0.5">Directly sourced & verified</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-800/60 flex items-center justify-center shrink-0 text-accent-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Fast Delivery</h4>
              <p className="text-slate-400 text-xs mt-0.5">Reliable nationwide shipping</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-800/60 flex items-center justify-center shrink-0 text-accent-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Easy Returns</h4>
              <p className="text-slate-400 text-xs mt-0.5">7-day hassle-free refunds</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-800/60 flex items-center justify-center shrink-0 text-accent-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">Dedicated Support</h4>
              <p className="text-slate-400 text-xs mt-0.5">Expert assistance anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-600 flex items-center justify-center text-white shadow-md">
                <span className="font-black text-base text-accent-400">BC</span>
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                BIG<span className="text-accent-400">CHAMP</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              India's premier sports platform connecting athletes, fitness enthusiasts, and champions with authentic equipment, certified wellness, and member-exclusive savings.
            </p>
            <div className="space-y-2 text-sm text-slate-400 pt-2">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-accent-400 shrink-0" />
                <span>{contact.phone || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-accent-400 shrink-0" />
                <span>{contact.email || 'support@bigchamp.in'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
                <span>{contact.address || 'BIGCHAMP Sports Arena, Bengaluru, India'}</span>
              </div>
            </div>
          </div>

          {/* Commerce Links */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Store & Gear</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/store" className="hover:text-white transition-colors">
                  All Sports Equipment
                </Link>
              </li>
              <li>
                <Link to="/store?category=APPAREL" className="hover:text-white transition-colors">
                  Apparel & Footwear
                </Link>
              </li>
              <li>
                <Link to="/store?category=GEARS" className="hover:text-white transition-colors">
                  Cricket & Team Sports
                </Link>
              </li>
              <li>
                <Link to="/cookey" className="hover:text-white transition-colors">
                  Cookey Special Tokens
                </Link>
              </li>
              <li>
                <Link to="/army-offer" className="hover:text-white transition-colors">
                  Defense Personnel Privileges
                </Link>
              </li>
            </ul>
          </div>

          {/* Membership & Services */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/membership" className="hover:text-white transition-colors">
                  Digital Pass & Membership
                </Link>
              </li>
              <li>
                <Link to="/dormitory" className="hover:text-white transition-colors">
                  Sports Arena Dormitory
                </Link>
              </li>
              <li>
                <Link to="/physio" className="hover:text-white transition-colors">
                  Sports Physiotherapy & Rehab
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About BIGCHAMP
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Customer Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Legal & Trust</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Lucky Draw Guidelines (Subject to approval)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} BIGCHAMP Sports & Wellness Pvt Ltd. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <span>Backend-Authoritative Pricing</span>
          <span>•</span>
          <span>Razorpay Verified Gateway</span>
        </div>
      </div>
    </footer>
  );
}

export default StorefrontFooter;
