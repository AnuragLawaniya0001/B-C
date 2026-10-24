import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { usePartnerAuthStore } from '../store/partnerAuthStore';
import { Building2 } from 'lucide-react';

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const setAuth = usePartnerAuthStore((state) => state.setAuth);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuth({ name: 'Apex Sports Physio Clinic', type: 'clinic' }, { accessToken: 'dummy-partner-token' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-50 text-primary-900 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-wider text-primary-900">
            BIG<span className="text-accent-500">CHAMP</span>
          </span>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-1">
            Partner Service Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Partner ID / Email" placeholder="partner@clinic.in" defaultValue="partner@apexphysio.in" />
          <Input label="Access Key / Password" type="password" placeholder="••••••••" defaultValue="password" />
          <Button variant="primary" type="submit" className="w-full mt-2">
            Access Partner Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
}
