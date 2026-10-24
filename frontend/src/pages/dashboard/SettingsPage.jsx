import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Account Settings"
        description="Notification preferences, security settings, and app options."
      />
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Security Preferences</h3>
        <p className="text-xs text-slate-500">Change password, manage 2-factor authentication, or deactivate account.</p>
        <Button variant="outline">Change Password</Button>
      </Card>
    </div>
  );
}
