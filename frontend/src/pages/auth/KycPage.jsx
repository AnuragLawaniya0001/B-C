import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function KycPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">KYC Verification</h1>
        <p className="text-sm text-slate-500 mb-6">
          Step 4: Provide verification details (Student / Athlete / Defense Personnel).
        </p>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Aadhaar / ID Number" placeholder="Enter identification number" />
          <Input label="Category (Student, Athlete, Defense)" placeholder="e.g. Defense or Student" />
          <Link to="/register/membership-pay">
            <Button variant="primary" className="w-full mt-2">
              Proceed to Membership Payment
            </Button>
          </Link>
        </form>
      </Card>
    </div>
  );
}
