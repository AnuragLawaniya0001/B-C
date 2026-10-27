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

  const membershipSettings = settings?.membership_settings || {
    enabled: true,
    price_paise: 10000,
    validity_days: 334,
    renewal_policy: 'EXTEND_FROM_EXPIRY',
    allow_renewal_while_active: true,
    allow_renewal_after_expiry: true,
    display_name: 'BIGCHAMP Athlete Club',
    description: 'Year-round sports perks, exclusive partner discounts, and verified athlete membership.',
    benefits: [
      'Discounts on certified partner sports facilities',
      'Exclusive sports nutrition & equipment store offers',
      'Priority physio & athlete recovery clinic access',
      'Verified digital athlete membership card',
    ],
    version: 1,
  };

  const updateMembershipSetting = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      membership_settings: {
        ...(prev.membership_settings || membershipSettings),
        [field]: val,
      },
    }));
  };

  const handleSaveMembership = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await api.put('/admin/membership/settings', membershipSettings);
      const updated = res.data || res;
      setSettings((prev) => ({ ...prev, membership_settings: updated }));
      setStatusMessage({
        type: 'success',
        text: `Membership configuration (Version ${updated.version || 1}) successfully saved to MongoDB!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error saving membership settings';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'membership', label: 'Membership Plan & Rules', icon: ShieldCheck },
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
          {/* TAB 0: Dynamic Membership Configuration */}
          {activeTab === 'membership' && (
            <Card className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Dynamic Membership Configuration</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      Version {membershipSettings.version || 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Authoritative business settings stored in MongoDB{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
                      db.settings: membership_settings
                    </code>
                    . Never hardcoded.
                  </p>
                  {membershipSettings.updated_at && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Last updated by <span className="font-medium text-slate-600">{membershipSettings.updated_by || 'admin'}</span> on{' '}
                      {new Date(membershipSettings.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={handleSaveMembership}
                  disabled={saving}
                  rightIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving...' : 'Save Membership Settings'}
                </Button>
              </div>

              {/* Status Alert Banner */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Snapshot Immutability Rule</p>
                  <p className="mt-0.5">
                    Modifying price or validity updates the configuration version for <strong>future purchases</strong>.
                    Existing active memberships and pending checkout sessions preserve their snapshotted price and duration without retroactive alteration.
                  </p>
                </div>
              </div>

              {/* Core Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Enabled Toggle */}
                <div className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Membership Purchase Enabled</p>
                    <p className="text-[11px] text-slate-500">Allow customers to purchase new memberships</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={membershipSettings.enabled !== false}
                    onChange={(e) => updateMembershipSetting('enabled', e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded border-slate-300"
                  />
                </div>

                {/* Membership Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Membership Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={Math.round((membershipSettings.price_paise || 10000) / 100)}
                    onChange={(e) =>
                      updateMembershipSetting('price_paise', Math.max(100, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Stored internally as integer paise: {membershipSettings.price_paise || 10000}
                  </span>
                </div>

                {/* Membership Validity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Membership Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={membershipSettings.validity_days || 334}
                    onChange={(e) =>
                      updateMembershipSetting('validity_days', Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Default: 334 days (~11 months)</span>
                </div>

                {/* Renewal Policy */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Renewal Policy Behavior
                  </label>
                  <select
                    value={membershipSettings.renewal_policy || 'EXTEND_FROM_EXPIRY'}
                    onChange={(e) => updateMembershipSetting('renewal_policy', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="EXTEND_FROM_EXPIRY">
                      EXTEND_FROM_EXPIRY — Extend from existing expiry if active, or from payment date if expired (Recommended)
                    </option>
                    <option value="START_FROM_ACTIVATION">
                      START_FROM_ACTIVATION — Start from payment activation date regardless of remaining validity
                    </option>
                  </select>
                  <span className="text-[11px] text-slate-400">
                    Controls boundary calculation when an existing member renews.
                  </span>
                </div>

                {/* Renewal while active */}
                <div className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Allow Renewal While Active</p>
                    <p className="text-[11px] text-slate-500">Permit renewals before current expiry</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={membershipSettings.allow_renewal_while_active !== false}
                    onChange={(e) =>
                      updateMembershipSetting('allow_renewal_while_active', e.target.checked)
                    }
                    className="w-5 h-5 text-primary-600 rounded border-slate-300"
                  />
                </div>

                {/* Renewal after expiry */}
                <div className="flex items-center justify-between p-3.5 border rounded-lg bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Allow Renewal After Expiry</p>
                    <p className="text-[11px] text-slate-500">Permit re-activation after membership expires</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={membershipSettings.allow_renewal_after_expiry !== false}
                    onChange={(e) =>
                      updateMembershipSetting('allow_renewal_after_expiry', e.target.checked)
                    }
                    className="w-5 h-5 text-primary-600 rounded border-slate-300"
                  />
                </div>

                {/* Display Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Membership Display Name
                  </label>
                  <input
                    type="text"
                    value={membershipSettings.display_name || ''}
                    onChange={(e) => updateMembershipSetting('display_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. BIGCHAMP Athlete Club"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storefront Description
                  </label>
                  <textarea
                    rows={2}
                    value={membershipSettings.description || ''}
                    onChange={(e) => updateMembershipSetting('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                    placeholder="Customer-facing description of membership privileges"
                  />
                </div>

                {/* Benefits List */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Informational Benefits (One item per line)
                  </label>
                  <textarea
                    rows={4}
                    value={Array.isArray(membershipSettings.benefits) ? membershipSettings.benefits.join('\n') : ''}
                    onChange={(e) => {
                      const lines = e.target.value
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                      updateMembershipSetting('benefits', lines);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 font-mono text-xs focus:ring-2 focus:ring-primary-500"
                    placeholder="Discounts on certified partner sports facilities&#10;Exclusive sports nutrition & equipment store offers&#10;Priority physio clinic access"
                  />
                  <span className="text-[11px] text-slate-400">
                    Enter benefit bullet points separated by line breaks. Rendered dynamically on the customer membership storefront.
                  </span>
                </div>
              </div>
            </Card>
          )}

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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={Math.round((businessRules.standard_delivery_charge_paise ?? 0) / 100)}
                    onChange={(e) =>
                      updateBusinessRule('standard_delivery_charge_paise', Math.max(0, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Paise: {businessRules.standard_delivery_charge_paise ?? 0} (0 = Free standard shipping)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={Math.round((businessRules.free_delivery_threshold_paise ?? 50000) / 100)}
                    onChange={(e) =>
                      updateBusinessRule('free_delivery_threshold_paise', Math.max(0, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Orders at or above this subtotal qualify for free shipping
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Member Store Privilege Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={businessRules.default_member_discount_percent ?? 10}
                    onChange={(e) =>
                      updateBusinessRule('default_member_discount_percent', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Default member store discount when product has no custom member_price
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={Math.round((businessRules.min_order_value_paise ?? 0) / 100)}
                    onChange={(e) =>
                      updateBusinessRule('min_order_value_paise', Math.max(0, Number(e.target.value) * 100))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    0 = No minimum order value enforced
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Items Per Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={businessRules.max_items_per_order ?? 50}
                    onChange={(e) =>
                      updateBusinessRule('max_items_per_order', Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">Maximum cumulative item quantity</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Partner Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={businessRules.partner_default_commission_percent ?? 15}
                    onChange={(e) =>
                      updateBusinessRule('partner_default_commission_percent', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    Platform standard commission for partner bookings
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax / GST Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={businessRules.tax_percent ?? 0}
                    onChange={(e) =>
                      updateBusinessRule('tax_percent', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    0 = Prices inclusive of all taxes
                  </span>
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
