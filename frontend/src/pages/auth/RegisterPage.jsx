import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Mail, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';

const emailSchema = z.object({
  identifier: z.string().email('Please enter a valid email address'),
});

const mobileSchema = z.object({
  identifier: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
});

export default function RegisterPage() {
  const [channel, setChannel] = useState('email'); // 'email' | 'mobile'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentSchema = channel === 'email' ? emailSchema : mobileSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(currentSchema),
  });

  const handleChannelSwitch = (newChannel) => {
    setChannel(newChannel);
    reset({ identifier: '' });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const identifier = data.identifier.trim();

    try {
      const response = await authService.sendOtp(identifier, 'REGISTER');
      const devOtp = response.data.dev_otp || response.data.mock_otp;

      // Store temp registration state for next steps
      localStorage.setItem(
        'bc_reg_tmp',
        JSON.stringify({
          identifier,
          channel,
          devOtp,
        })
      );

      if (devOtp) {
        toast.success(`OTP Sent! (Dev Code: ${devOtp})`, { duration: 6000 });
      } else {
        toast.success('Verification OTP has been sent successfully!');
      }

      navigate('/register/verify-otp');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send OTP. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-lg border-slate-200 bg-white">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group mb-2">
            <span className="text-3xl font-black tracking-tight text-primary-900 group-hover:opacity-90 transition-opacity">
              BIG<span className="text-accent-500">CHAMP</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Free Registration</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join the sports and fitness ecosystem.
          </p>
        </div>

        {/* Channel Toggle (Email / Mobile) */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => handleChannelSwitch('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              channel === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => handleChannelSwitch('mobile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              channel === 'mobile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Send OTP Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {channel === 'email' ? (
            <div className="space-y-1.5">
              <label
                htmlFor="email-identifier"
                className="block text-sm font-medium text-slate-700"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email-identifier"
                type="email"
                placeholder="athlete@example.com"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  errors.identifier
                    ? 'border-red-400 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 text-slate-900 focus:border-primary-600 focus:ring-primary-100'
                }`}
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-xs text-red-600">{errors.identifier.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="mobile-identifier"
                className="block text-sm font-medium text-slate-700"
              >
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-100 focus-within:ring-offset-1">
                <span className="inline-flex items-center px-3 text-sm font-semibold text-slate-500 bg-slate-50 border-r border-slate-200">
                  +91
                </span>
                <input
                  id="mobile-identifier"
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2 text-sm bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && (
                <p className="text-xs text-red-600">{errors.identifier.message}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Send Verification Code
          </Button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-900 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
