import React from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

export function LandingFooter() {
  const { getSiteContact } = useSettingsStore();
  const contact = getSiteContact();

  return (
    <footer className="relative z-20 py-12 px-6 text-slate-400 text-xs border-t border-white/10 bg-[#02050b]/95 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Column 1: Brand & Promise */}
        <div className="text-left">
          <div className="flex items-center gap-2.5 mb-3">
            <img
              src="/assets/logo.png"
              alt="Bigchamp Logo"
              className="h-8 w-auto opacity-95"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-syne font-black text-white tracking-widest text-lg">
              BIG<span className="text-amber-400">CHAMP</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4 max-w-sm">
            Born to Win. India ka pehla unified sports, student aur defense ecosystem. Match-grade gear, tournament hostel stays, aur certified physio recovery.
          </p>
          <div className="text-[11px] text-slate-400">
            Support Helpline:{' '}
            <a href={`mailto:${contact.email || 'support@bigchamp.in'}`} className="text-amber-400 hover:underline">
              {contact.email || 'support@bigchamp.in'}
            </a>
          </div>
        </div>

        {/* Column 2: Ecosystem & Services */}
        <div className="text-left">
          <h4 className="font-syne font-bold text-white uppercase tracking-wider text-xs mb-3">
            The Ecosystem
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <Link to="/store" className="hover:text-amber-400 transition-colors font-medium">
                Official Sports Gear Store
              </Link>
            </li>
            <li>
              <Link to="/membership" className="hover:text-amber-400 transition-colors font-medium">
                ₹100 VIP Athlete Pass
              </Link>
            </li>
            <li>
              <Link to="/dormitory" className="hover:text-amber-400 transition-colors">
                Athlete Dormitories &amp; Hostels
              </Link>
            </li>
            <li>
              <Link to="/physio" className="hover:text-amber-400 transition-colors">
                Sports Physio Rehabilitation
              </Link>
            </li>
            <li>
              <Link to="/cookey" className="hover:text-amber-400 transition-colors">
                Cookey Nutrition &amp; Draws
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Trust & Legal */}
        <div className="text-left">
          <h4 className="font-syne font-bold text-white uppercase tracking-wider text-xs mb-3">
            Trust &amp; Policies
          </h4>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Customer Care
              </Link>
            </li>
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
              <Link to="/shipping-policy" className="hover:text-white transition-colors">
                Free Shipping Above ₹500 Policy
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="hover:text-white transition-colors">
                7-Day Hassle-Free Exchange
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
        <div>&copy; {new Date().getFullYear()} Bigchamp Sports Private Limited. All Rights Reserved.</div>
        <div className="text-slate-400">
          Engineered with Precision for Indian Athletes &bull; Sarhad se Stadium Tak
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
