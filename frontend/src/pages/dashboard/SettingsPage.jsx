import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <PageHeader
        title="Account Settings"
        description="Notification preferences, security settings, and app options."
        backLink="/store"
      />
      <Card className="p-6 space-y-4 bg-slate-900/80 border-white/10">
        <h3 className="font-semibold text-white text-base">Security Preferences</h3>
        <p className="text-sm text-slate-400">Change password, manage 2-factor authentication, or deactivate account.</p>
        <div className="pt-2">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Change Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
