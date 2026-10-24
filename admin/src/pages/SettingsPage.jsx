import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Settings,
  Sliders,
  Phone,
  Flag,
  Globe,
  Save,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business_rules');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      const data = res.data || res;
      setSettings(data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load settings from server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key, value) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await api.put(`/admin/settings/${key}`, { value });
      const updated = res.data || res;
      setSettings((prev) => ({ ...prev, [key]: updated.value }));
      setStatusMessage({
        type: 'success',
        text: `Settings for '${key.replace('_', ' ')}' successfully saved to MongoDB!`,
      });
      // Clear notification after 4 seconds
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error saving settings';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const businessRules = settings?.business_rules || {};
  const siteContact = settings?.site_contact || {};
  const featureFlags = settings?.feature_flags || {};
  const defaultLanguage = settings?.default_language || {};
  const paymentRouting = businessRules?.payment_routing || {
    gateway: 'DEMO_SIMULATION',
    test_mode: true,
    notes: 'Config only, live routing deferred',
  };

  const updateBusinessRule = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      business_rules: {
        ...(prev.business_rules || {}),
        [field]: val,
      },
    }));
  };

  const updateSiteContact = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      site_contact: {
        ...(prev.site_contact || {}),
        [field]: val,
      },
    }));
  };

  const updateFeatureFlag = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      feature_flags: {
        ...(prev.feature_flags || {}),
        [field]: val,
      },
    }));
  };

  const updatePaymentRouting = (field, val) => {
    const updated = { ...paymentRouting, [field]: val };
    updateBusinessRule('payment_routing', updated);
  };

  const tabs = [
    { id: 'business_rules', label: 'Business & Pricing', icon: Sliders },
    { id: 'payment_routing', label: 'Payment Gateway Config', icon: CreditCard },
    { id: 'contact', label: 'Contact & Support', icon: Phone },
    { id: 'feature_flags', label: 'Feature Toggles', icon: Flag },
    { id: 'languages', label: 'Localization & Languages', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" /> Dynamic Platform Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Everything dynamic: Real-time business rules, membership validity, cashback, and features stored in MongoDB{' '}
          <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">settings</code> collection.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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
        <Card className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span>Loading settings from MongoDB...</span>
        </Card>
      ) : (
        <>
          {/* TAB 1: Business Rules */}
          {activeTab === 'business_rules' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Ecosystem Business Rules & Pricing</h2>
                  <p className="text-xs text-slate-500">
                    Live dynamic constants consumed across customer and partner portals.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleSave('business_rules', businessRules)}
                  disabled={saving}
                  rightIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Business Rules'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Membership Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={Math.round((businessRules.card_fee_paise || 10000) / 100)}
                    onChange={(e) =>
                      updateBusinessRule('card_fee_paise', Math.max(100, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Stored as paise: {businessRules.card_fee_paise || 10000}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Card Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="730"
                    value={businessRules.card_validity_days || 334}
                    onChange={(e) => updateBusinessRule('card_validity_days', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Default: 334 days (~11 months)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Joining Wallet Cashback (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={businessRules.joining_cashback_percent || 10}
                    onChange={(e) => updateBusinessRule('joining_cashback_percent', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">e.g. 10% of ₹100 = ₹10 joining credit</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Defense Privilege Extra Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={businessRules.army_extra_discount_percent || 10}
                    onChange={(e) => updateBusinessRule('army_extra_discount_percent', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Additional discount for verified Army/Defense</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cookey Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={Math.round((businessRules.cookey_price_paise || 10000) / 100)}
                    onChange={(e) =>
                      updateBusinessRule('cookey_price_paise', Math.max(100, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Exclusive member reward item price</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cookey Cooldown Interval (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={businessRules.cookey_cooldown_days || 7}
                    onChange={(e) => updateBusinessRule('cookey_cooldown_days', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Minimum days between successive purchases</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lucky Draw Prize Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={Math.round((businessRules.lucky_draw_prize_paise || 50000) / 100)}
                    onChange={(e) =>
                      updateBusinessRule('lucky_draw_prize_paise', Math.max(0, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Weekly prize pool reward</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lucky Draw Frequency
                  </label>
                  <select
                    value={businessRules.lucky_draw_frequency || 'weekly'}
                    onChange={(e) => updateBusinessRule('lucky_draw_frequency', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lucky Draw Winner Selection Mode
                  </label>
                  <select
                    value={businessRules.winner_selection_mode || 'simulated_random'}
                    onChange={(e) => updateBusinessRule('winner_selection_mode', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="simulated_random">Simulated Random (Auto Algorithm)</option>
                    <option value="manual_draw">Manual Admin Draw Confirmation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dormitory Default Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={businessRules.default_dormitory_discount_percent || 15}
                    onChange={(e) =>
                      updateBusinessRule('default_dormitory_discount_percent', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physio Clinic Default Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={businessRules.default_physio_discount_percent || 20}
                    onChange={(e) =>
                      updateBusinessRule('default_physio_discount_percent', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* AutoPay Configuration Toggle */}
                <div className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50 md:col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-xs font-bold text-slate-800">AutoPay Mandate Offered</p>
                    <p className="text-[11px] text-slate-500">
                      Configuration flag only (no real bank recurring charges)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={businessRules.autopay_enabled === true}
                    onChange={(e) => updateBusinessRule('autopay_enabled', e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded border-slate-300"
                  />
                </div>

                {/* Partner Visibility Toggle */}
                <div className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50 md:col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Partner Directory Visibility</p>
                    <p className="text-[11px] text-slate-500">Show offline clinics and dormitories</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={businessRules.partner_visibility !== false}
                    onChange={(e) => updateBusinessRule('partner_visibility', e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded border-slate-300"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: Payment Routing Configuration */}
          {activeTab === 'payment_routing' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment Routing Configuration</h2>
                  <p className="text-xs text-slate-500">
                    Routing metadata placeholder for future production payment integration.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleSave('business_rules', businessRules)}
                  disabled={saving}
                  rightIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Gateway Config'}
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Safety Boundary & Simulation Rule</p>
                  <p className="mt-0.5">
                    Live money movement, card mandates, and real banking credentials are strictly prohibited.
                    This section stores provider routing routing identifiers only. Never input production secret
                    keys.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Active Payment Gateway Routing
                  </label>
                  <select
                    value={paymentRouting.gateway || 'DEMO_SIMULATION'}
                    onChange={(e) => updatePaymentRouting('gateway', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="DEMO_SIMULATION">DEMO_SIMULATION (Mock Gateway Simulator)</option>
                    <option value="RAZORPAY_SANDBOX">Razorpay Sandbox (Future Provider)</option>
                    <option value="CASHFREE_SANDBOX">Cashfree Sandbox (Future Provider)</option>
                    <option value="PHONEPE_SANDBOX">PhonePe Sandbox (Future Provider)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gateway Environment Mode
                  </label>
                  <select
                    value={paymentRouting.test_mode ? 'test' : 'live'}
                    onChange={(e) => updatePaymentRouting('test_mode', e.target.value === 'test')}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="test">Test Mode / Sandbox (Safe Simulation)</option>
                    <option value="live" disabled>
                      Production Live (Locked in Phase 1)
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Integration Notes & Webhook Route
                  </label>
                  <input
                    type="text"
                    value={paymentRouting.notes || ''}
                    onChange={(e) => updatePaymentRouting('notes', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. In simulation mode; webhook target: /api/v1/payments/webhook"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: Contact & Support */}
          {activeTab === 'contact' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Contact & Support Details</h2>
                  <p className="text-xs text-slate-500">
                    Public contact details displayed on the footer, contact page, and membership receipts.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleSave('site_contact', siteContact)}
                  disabled={saving}
                  rightIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Contact'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={siteContact.email || ''}
                    onChange={(e) => updateSiteContact('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Support Helpline Phone</label>
                  <input
                    type="text"
                    value={siteContact.phone || ''}
                    onChange={(e) => updateSiteContact('phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={siteContact.working_hours || ''}
                    onChange={(e) => updateSiteContact('working_hours', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
                  <textarea
                    rows={2}
                    value={siteContact.address || ''}
                    onChange={(e) => updateSiteContact('address', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: Feature Flags */}
          {activeTab === 'feature_flags' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Feature Toggles</h2>
                  <p className="text-xs text-slate-500">Live feature status from database settings collection.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleSave('feature_flags', featureFlags)}
                  disabled={saving}
                  rightIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Flags'}
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'cookey_enabled',
                    name: 'Cookey Rewards Module',
                    desc: 'Weekly Cookey purchases & lucky draws.',
                  },
                  {
                    key: 'army_offer_enabled',
                    name: 'Army & Defense Privilege',
                    desc: 'Armed forces 10% privilege discount on store purchases.',
                  },
                  {
                    key: 'lucky_draw_enabled',
                    name: 'Weekly Lucky Draw Simulation',
                    desc: 'Weekly rewards pool and member participation.',
                  },
                  {
                    key: 'booking_enabled',
                    name: 'Online Offline Facility Bookings',
                    desc: 'Direct booking requests for dormitories and physios.',
                  },
                  {
                    key: 'maintenance_mode',
                    name: 'Platform Maintenance Mode',
                    desc: 'Display maintenance banner across public portals.',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featureFlags[item.key] === true}
                        onChange={(e) => updateFeatureFlag(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 5: Languages */}
          {activeTab === 'languages' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Language & Localization Settings</h2>
                  <p className="text-xs text-slate-500">Live locale options stored in MongoDB settings collection.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleSave('default_language', defaultLanguage)}
                  disabled={saving}
                  rightIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Languages'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Language Code</label>
                  <select
                    value={defaultLanguage.code || 'en'}
                    onChange={(e) => {
                      const code = e.target.value;
                      const name = code === 'hi' ? 'हिन्दी' : 'English';
                      setSettings((prev) => ({
                        ...prev,
                        default_language: { ...(prev.default_language || {}), code, name },
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">हिन्दी (hi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enabled Languages</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(defaultLanguage.available_languages || [
                      { code: 'en', name: 'English' },
                      { code: 'hi', name: 'हिन्दी' },
                    ]).map((lang, idx) => (
                      <span key={idx} className="px-3 py-1 rounded bg-primary-100 text-primary-800 text-xs font-semibold">
                        {lang.name} ({lang.code})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
