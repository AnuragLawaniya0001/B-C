import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAdminAuthStore } from '../store/adminAuthStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAdminAuthStore((state) => state.setAuth);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Temporary stub auth for development demonstration
    setAuth({ name: 'Admin', role: 'admin' }, { accessToken: 'dummy-admin-token' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white">
        <div className="text-center mb-6">
          <span className="font-black text-2xl tracking-wider text-primary-900">
            BIG<span className="text-accent-500">CHAMP</span>
          </span>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-1">
            Admin Management Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Admin Email" placeholder="admin@bigchamp.in" defaultValue="admin@bigchamp.in" />
          <Input label="Password" type="password" placeholder="••••••••" defaultValue="password" />
          <Button variant="primary" type="submit" className="w-full mt-2">
            Enter Admin Console
          </Button>
        </form>
      </Card>
    </div>
  );
}
