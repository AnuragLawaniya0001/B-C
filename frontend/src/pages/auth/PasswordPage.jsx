import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const passwordSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long'),
    email: z
      .string()
      .email('Please enter a valid email address'),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function PasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Read stored registration data
  const regData = JSON.parse(localStorage.getItem('bc_reg_tmp') || 'null');
  const identifier = regData?.identifier || '';
  const channel = regData?.channel || 'email';

  const isEmailChannel = channel === 'email';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      full_name: '',
      email: isEmailChannel ? identifier : '',
      mobile: !isEmailChannel ? identifier : '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!identifier) {
      toast.error('Session expired. Please restart registration.');
      navigate('/register', { replace: true });
    }
  }, [identifier, navigate]);

  const watchedPassword = watch('password', '');

  // Password rules validation for meter
  const hasMinLength = watchedPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(watchedPassword);
  const hasLower = /[a-z]/.test(watchedPassword);
  const hasNumber = /\d/.test(watchedPassword);
  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  const getStrengthMeta = () => {
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (strengthScore <= 3) return { label: 'Moderate', color: 'bg-amber-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strengthMeta = getStrengthMeta();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const payload = {
        identifier,
        full_name: data.full_name.trim(),
        email: data.email.trim(),
        mobile: data.mobile.trim(),
        password: data.password,
      };

      const res = await authService.register(payload);
      const resData = res.data;

      // Set auth state in Zustand and localStorage
      setAuth(resData.user, resData.access_token, resData.refresh_token);

      // Clean up temporary registration storage
      localStorage.removeItem('bc_reg_tmp');

      toast.success('Account created successfully!');
      navigate('/register/success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[460px] p-6 sm:p-8 shadow-lg border-slate-200 bg-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-900 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Complete Profile & Password</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Set up your credentials to complete your free registration.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            required
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            placeholder="rahul@example.com"
            required
            readOnly={isEmailChannel}
            disabled={isEmailChannel}
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Mobile */}
          <Input
            label="Mobile Number (10 Digits)"
            type="tel"
            maxLength={10}
            placeholder="9876543210"
            required
            readOnly={!isEmailChannel}
            disabled={!isEmailChannel}
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          {/* Password with Eye Toggle */}
          <div className="w-full space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Create Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 chars with upper, lower, number"
                className={`w-full px-3.5 py-2 pr-10 text-sm rounded-lg border bg-white transition-colors duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  errors.password
                    ? 'border-red-400 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 text-slate-900 focus:border-primary-600 focus:ring-primary-100'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}

            {/* Password Strength Meter */}
            {watchedPassword.length > 0 && (
              <div className="pt-1.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Strength:</span>
                  <span className="font-semibold text-slate-700">{strengthMeta.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strengthMeta.color} ${strengthMeta.width} transition-all duration-300`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1">
                  <span className={hasMinLength ? 'text-emerald-600 font-medium' : ''}>
                    {hasMinLength ? '✓' : '•'} 8+ characters
                  </span>
                  <span className={hasUpper ? 'text-emerald-600 font-medium' : ''}>
                    {hasUpper ? '✓' : '•'} 1 Uppercase
                  </span>
                  <span className={hasLower ? 'text-emerald-600 font-medium' : ''}>
                    {hasLower ? '✓' : '•'} 1 Lowercase
                  </span>
                  <span className={hasNumber ? 'text-emerald-600 font-medium' : ''}>
                    {hasNumber ? '✓' : '•'} 1 Number
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password with Eye Toggle */}
          <div className="w-full space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                className={`w-full px-3.5 py-2 pr-10 text-sm rounded-lg border bg-white transition-colors duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  errors.confirmPassword
                    ? 'border-red-400 text-red-900 focus:border-red-500 focus:ring-red-200'
                    : 'border-slate-300 text-slate-900 focus:border-primary-600 focus:ring-primary-100'
                }`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create My Free Account
          </Button>
        </form>
      </Card>
    </div>
  );
}
