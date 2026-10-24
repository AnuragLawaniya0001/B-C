import React from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="My Profile"
        description="Manage your personal details, membership credentials, and emergency contacts."
      />
      <Card className="p-6 space-y-4">
        <Input label="Full Name" defaultValue="Rahul Sharma" />
        <Input label="Email Address" defaultValue="rahul.sharma@example.com" />
        <Input label="Mobile Number" defaultValue="+91 9876543210" disabled helperText="Contact support to change verified number" />
        <Input label="Membership Category" defaultValue="Athlete / Student" disabled />
        <Button variant="primary">Update Profile</Button>
      </Card>
    </div>
  );
}
