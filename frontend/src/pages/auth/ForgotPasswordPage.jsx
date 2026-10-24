import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { KeyRound, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [identifier, setIdentifier] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const cleanId = data.identifier.trim();
    setIdentifier(cleanId);

    try {
      const res = await authService.sendOtp(cleanId, 'RESET_PASSWORD');
      const devOtp = res.data.dev_otp || res.data.mock_otp;
      if (devOtp) {
        toast.success(`Reset code sent! (Dev OTP: ${devOtp})`, { duration: 6000 });
      } else {
        toast.success('Password reset instructions sent!');
      }
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'No account found with this identifier.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-lg border-slate-200 bg-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-900 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enter your registered email or mobile to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Code Sent</span>
              </p>
              <p>
                We have dispatched a reset code to{' '}
                <span className="font-semibold text-slate-900">{identifier}</span>.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Password reset submission is in progress. Please check your messages.
            </p>
            <Link to="/login" className="block w-full">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email or Mobile Number"
              placeholder="e.g. rahul@example.com or 9876543210"
              required
              error={errors.identifier?.message}
              {...register('identifier', {
                required: 'Please enter your registered email or mobile number',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Reset Code
            </Button>

            <div className="pt-3 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary-900 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
