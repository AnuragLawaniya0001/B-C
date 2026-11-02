import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { ShieldAlert, Loader2, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@bigchamp.in');
  const [password, setPassword] = useState('Admin@123');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = useAdminAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.error || 'Invalid credentials. Access denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#02050b] relative overflow-hidden">
      {/* Background Ambience & Radial Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.08),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.06),transparent_50%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <Card className="w-full max-w-md p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.15)] bg-[#060b16]/90 backdrop-blur-2xl border border-white/15 relative z-10 rounded-3xl">
        {/* Brand Crest & Title */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-3">
            <img
              src="/assets/logo.png"
              alt="Bigchamp Brand Crest"
              className="h-16 w-auto mx-auto filter drop-shadow-[0_4px_20px_rgba(245,158,11,0.6)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-syne font-black text-2xl sm:text-3xl tracking-wider text-white">
              BIG<span className="g-gold">CHAMP</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-widest">
              ADMIN
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-400 tracking-wide mt-1">
            Operations &amp; Merchandising Control Center
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Email"
            type="email"
            placeholder="admin@bigchamp.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="text-white"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gold py-3 px-6 text-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security & Credentials Pill */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span className="font-mono text-slate-400 text-[10px]">v2.4 SECURE</span>
        </div>
      </Card>
    </div>
  );
}
