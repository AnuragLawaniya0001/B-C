import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, Sliders, Phone, Flag, Globe, Save } from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business_rules');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/settings/public')
      .then((res) => {
        if (isMounted) {
          setSettings(res.data);
        }
      })
      .catch(() => {
        if (isMounted) setSettings(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const businessRules = settings?.business_rules || {};
  const siteContact = settings?.site_contact || {};
  const featureFlags = settings?.feature_flags || {};
  const defaultLanguage = settings?.default_language || {};

  const tabs = [
    { id: 'business_rules', label: 'Business Rules', icon: Sliders },
    { id: 'contact', label: 'Contact & Support', icon: Phone },
    { id: 'feature_flags', label: 'Feature Flags', icon: Flag },
    { id: 'languages', label: 'Localization & Languages', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" /> Platform Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Everything dynamic: Real-time business constants, support details, and feature toggles from MongoDB <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">settings</code> collection.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-700 bg-primary-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card className="p-6">
          <p className="text-sm text-slate-500">Loading settings from database...</p>
        </Card>
      ) : (
        <>
          {/* Tab 1: Business Rules */}
          {activeTab === 'business_rules' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Ecosystem Business Rules</h2>
                <p className="text-xs text-slate-500">Live values populated directly from MongoDB collection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Membership Fee (₹)</label>
                  <input
                    type="number"
                    value={(businessRules.card_fee_paise || 10000) / 100}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: card_fee_paise ({businessRules.card_fee_paise || 10000})</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Validity (Days)</label>
                  <input
                    type="number"
                    value={businessRules.card_validity_days || 334}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: card_validity_days</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Wallet Cashback (%)</label>
                  <input
                    type="number"
                    value={businessRules.joining_cashback_percent || 10}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: joining_cashback_percent</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cookey Price (₹)</label>
                  <input
                    type="number"
                    value={(businessRules.cookey_price_paise || 10000) / 100}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: cookey_price_paise ({businessRules.cookey_price_paise || 10000})</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cookey Cooldown (Days)</label>
                  <input
                    type="number"
                    value={businessRules.cookey_cooldown_days || 7}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: cookey_cooldown_days</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Defense Extra Privilege Discount (%)</label>
                  <input
                    type="number"
                    value={businessRules.army_extra_discount_percent || 10}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: army_extra_discount_percent</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lucky Draw Prize (₹)</label>
                  <input
                    type="number"
                    value={(businessRules.lucky_draw_prize_paise || 50000) / 100}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: lucky_draw_prize_paise</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lucky Draw Frequency</label>
                  <input
                    type="text"
                    value={businessRules.lucky_draw_frequency || 'weekly'}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                  <span className="text-[11px] text-slate-400">Key: lucky_draw_frequency</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" disabled rightIcon={<Save className="w-4 h-4" />}>
                  Save Rules (Prompt #7)
                </Button>
              </div>
            </Card>
          )}

          {/* Tab 2: Contact & Support */}
          {activeTab === 'contact' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Contact & Support Details</h2>
                <p className="text-xs text-slate-500">Live values from MongoDB settings collection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                  <input type="email" value={siteContact.email || ''} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800" readOnly />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Support Helpline Phone</label>
                  <input type="text" value={siteContact.phone || ''} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800" readOnly />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Office Address</label>
                  <textarea rows={2} value={siteContact.address || ''} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800" readOnly />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" disabled rightIcon={<Save className="w-4 h-4" />}>
                  Save Contact (Prompt #7)
                </Button>
              </div>
            </Card>
          )}

          {/* Tab 3: Feature Flags */}
          {activeTab === 'feature_flags' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Feature Toggles</h2>
                <p className="text-xs text-slate-500">Live feature status from database settings collection.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Cookey Rewards Module</p>
                    <p className="text-xs text-slate-500">Weekly Cookey purchases & lucky draws.</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${featureFlags.cookey_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {featureFlags.cookey_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Army & Defense Privilege Registration</p>
                    <p className="text-xs text-slate-500">Armed forces 10% privilege discount.</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${featureFlags.army_offer_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {featureFlags.army_offer_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Maintenance Mode</p>
                    <p className="text-xs text-slate-500">Redirect customer traffic to maintenance message.</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${featureFlags.maintenance_mode ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                    {featureFlags.maintenance_mode ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" disabled rightIcon={<Save className="w-4 h-4" />}>
                  Save Flags (Prompt #7)
                </Button>
              </div>
            </Card>
          )}

          {/* Tab 4: Localization & Languages */}
          {activeTab === 'languages' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Language & Localization Settings</h2>
                <p className="text-xs text-slate-500">Live locale options from settings collection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Language</label>
                  <input
                    type="text"
                    value={`${defaultLanguage.name || 'English'} (${defaultLanguage.code || 'en'})`}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-800"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Languages</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(defaultLanguage.available_languages || []).map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 rounded bg-primary-100 text-primary-800 text-xs font-semibold">
                        {lang.name} ({lang.code})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" disabled rightIcon={<Save className="w-4 h-4" />}>
                  Save Locale (Prompt #7)
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
