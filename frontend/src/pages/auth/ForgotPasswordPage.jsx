import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { KeyRound, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password, 3: Success
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');

  // Step 1 Form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm({
    defaultValues: { identifier: '' },
  });

  // Step 2 Form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    watch: watchStep2,
    formState: { errors: errorsStep2 },
  } = useForm({
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSendOtp = async (data) => {
    setLoading(true);
    const cleanId = data.identifier.trim();
    setIdentifier(cleanId);

    try {
      const res = await authService.sendOtp(cleanId, 'RESET_PASSWORD');
      const devOtp = res.data?.dev_otp || res.data?.mock_otp;
      if (devOtp) {
        toast.success(`Reset code sent! (Dev OTP: ${devOtp})`, { duration: 8000 });
      } else {
        toast.success('Password reset code sent to your registered device!');
      }
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.detail || 'No account found with this email or mobile.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data) => {
    setLoading(true);

    try {
      await authService.resetPassword(identifier, data.newPassword, data.otp.trim());
      toast.success('Password updated successfully!');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to reset password. Check your OTP.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-xl border-slate-200 bg-white rounded-3xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-900 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {step === 3 ? 'Password Reset' : 'Reset Password'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === 1 && 'Enter your registered email or mobile to receive a verification code.'}
            {step === 2 && `Enter the 6-digit code sent to ${identifier} and choose your new password.`}
            {step === 3 && 'Your password has been changed. You can now login.'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmitStep1(onSendOtp)} className="space-y-4">
            <Input
              label="Email or Mobile Number"
              placeholder="e.g. name@example.com or 9876543210"
              required
              error={errorsStep1.identifier?.message}
              {...registerStep1('identifier', {
                required: 'Please enter your registered email or mobile number',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-bold"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Verification Code
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

        {step === 2 && (
          <form onSubmit={handleSubmitStep2(onResetPassword)} className="space-y-4">
            <Input
              label="6-Digit Verification Code"
              placeholder="e.g. 123456"
              required
              maxLength={6}
              error={errorsStep2.otp?.message}
              {...registerStep2('otp', {
                required: 'Enter the 6-digit code',
                minLength: { value: 4, message: 'Code must be at least 4 digits' },
              })}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 characters with upper, lower, digit"
              required
              error={errorsStep2.newPassword?.message}
              {...registerStep2('newPassword', {
                required: 'Please enter your new password',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              required
              error={errorsStep2.confirmPassword?.message}
              {...registerStep2('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (val) =>
                  val === watchStep2('newPassword') || 'Passwords do not match',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 font-bold"
              isLoading={loading}
              rightIcon={<Lock className="w-4 h-4" />}
            >
              Update Password
            </Button>

            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800"
              >
                ← Change Email/Mobile
              </button>
              <Link to="/login" className="text-primary-900 font-semibold hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800">
              <p className="font-bold text-sm mb-1">Password Changed Successfully!</p>
              <p>Your account password has been updated. Please sign in with your new credentials.</p>
            </div>

            <Link to="/login" className="block w-full">
              <Button variant="primary" className="w-full font-bold">
                Sign In Now
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
