import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        full_name: fullName.trim(),
      };
      if (email.trim() && email.trim() !== user?.email) {
        payload.email = email.trim();
      }

      const res = await authService.updateProfile(payload);
      const updated = res.data || res;
      setUser({ ...user, ...updated });
      setSuccess('Profile updated successfully!');
      toast.success('Profile saved successfully!');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <PageHeader
        title="Personal Profile"
        description="View and update your verified customer credentials and contact details."
        backLink="/store"
        backText="Back to Store"
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Legal Name"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Mobile Number"
            value={mobile || 'Not set'}
            disabled
            helperText="Mobile number was verified during registration. Contact support to update."
          />

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>KYC: <strong className="uppercase text-white">{user?.kyc_status || 'NOT_SUBMITTED'}</strong></span>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
