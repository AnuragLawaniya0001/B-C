import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, Copy, Check, ArrowRight, Tag } from 'lucide-react';
import api from '../../services/api';

const POPUP_SUPPRESSION_KEY = 'bigchamp_popup_suppressed_until';
const LAST_SEEN_POPUP_KEY = 'bigchamp_last_seen_popup_id';

export function PromotionalPopupModal() {
  const [popup, setPopup] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // 1. Check suppression period in localStorage
    const suppressedUntil = localStorage.getItem(POPUP_SUPPRESSION_KEY);
    if (suppressedUntil && Date.now() < parseInt(suppressedUntil, 10)) {
      return; // Still suppressed
    }

    const lastSeenId = localStorage.getItem(LAST_SEEN_POPUP_KEY) || '';

    // 2. Fetch eligible active popup campaign
    let timer = null;
    api
      .get(`/promotions/popup/active?last_seen_id=${encodeURIComponent(lastSeenId)}`)
      .then((res) => {
        const campaign = res.data;
        if (campaign && campaign.popup_id) {
          setPopup(campaign);
          const delayMs = (campaign.frequency_delay_seconds || 3) * 1000;
          timer = setTimeout(() => {
            setIsOpen(true);
          }, delayMs);
        }
      })
      .catch((err) => {
        // Silently ignore if no campaign or network error
      });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Keyboard Escape listener & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (popup) {
      // Set suppression period in localStorage
      const suppressionDays = popup.suppression_days || 3;
      const expireTime = Date.now() + suppressionDays * 24 * 60 * 60 * 1000;
      localStorage.setItem(POPUP_SUPPRESSION_KEY, expireTime.toString());
      localStorage.setItem(LAST_SEEN_POPUP_KEY, popup.popup_id);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !popup) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 relative animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Campaign Media / Poster */}
        <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
          {popup.media_url ? (
            <img
              src={popup.media_url}
              alt={popup.headline}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/uploads/media/images/hero_campaign_banner_1793006420241.jpg';
              }}
            />
          ) : (
            <div className="text-slate-500 font-mono text-xs">BIGCHAMP PROMOTION</div>
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Discount Badge */}
          {popup.discount_badge && (
            <div className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-accent-500 text-white text-xs font-black uppercase tracking-wider shadow-lg">
              {popup.discount_badge}
            </div>
          )}

          {/* Close Button */}
          <button
            ref={closeButtonRef}
            onClick={handleDismiss}
            aria-label="Close promotional popup"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 text-center space-y-4">
          <div className="space-y-1.5">
            <h3
              id="promo-popup-heading"
              className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight leading-tight"
            >
              {popup.headline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              {popup.subheadline}
            </p>
          </div>

          {/* Coupon Code Pill */}
          {popup.discount_code && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-dashed border-slate-300">
              <span className="font-mono font-bold text-sm text-slate-900 tracking-wider">
                {popup.discount_code}
              </span>
              <button
                onClick={() => handleCopyCode(popup.discount_code)}
                className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-950 hover:bg-primary-900 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          )}

          {/* CTA & Dismiss Action */}
          <div className="pt-2 space-y-2">
            <Link
              to={popup.cta_link || '/offers'}
              onClick={handleDismiss}
              className="block w-full py-3 px-6 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {popup.cta_text || 'Claim Offer'}
            </Link>

            <button
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium py-1"
            >
              No thanks, continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
