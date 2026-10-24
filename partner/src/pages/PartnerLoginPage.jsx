import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { usePartnerAuthStore } from '../store/partnerAuthStore';
import { Building2, ShieldAlert, Loader2 } from 'lucide-react';

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('partner@apexphysio.in');
  const [password, setPassword] = useState('Partner@123');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = usePartnerAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and access password.');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.error || 'Invalid partner credentials. Access denied.');
    }
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

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Partner ID / Email"
            type="email"
            placeholder="partner@apexphysio.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            label="Access Key / Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Partner...
              </span>
            ) : (
              'Access Partner Dashboard'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
