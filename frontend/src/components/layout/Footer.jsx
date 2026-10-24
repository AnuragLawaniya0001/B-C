import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight text-white">
                BIG<span className="text-accent-500">CHAMP</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Bigchamp is India&apos;s pioneering sports, student, and defense ecosystem. Providing digital membership benefits, offline student dormitories, physio recovery clinics, and specialized gear.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-accent-500" /> Defense Recognized
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-accent-500" /> Athlete Powered
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/store" className="hover:text-white transition-colors">
                  Sports Gear & Apparel
                </Link>
              </li>
              <li>
                <Link to="/cookey" className="hover:text-white transition-colors">
                  Exclusive Cookey Product
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-white transition-colors">
                  ₹100 Digital Membership Card
                </Link>
              </li>
              <li>
                <Link to="/dormitory" className="hover:text-white transition-colors">
                  Athlete & Student Dormitories
                </Link>
              </li>
              <li>
                <Link to="/physio" className="hover:text-white transition-colors">
                  Physio & Recovery Clinics
                </Link>
              </li>
              <li>
                <Link to="/army-offer" className="hover:text-white transition-colors text-accent-400">
                  Army & Defense Special Offer
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase">
              Company & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Bigchamp
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#draw-rules" className="hover:text-white transition-colors">
                  Cookey Lucky Draw Guidelines
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Bigchamp Technologies. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for athletes, students & defense champions.
          </p>
        </div>
      </div>
    </footer>
  );
}
