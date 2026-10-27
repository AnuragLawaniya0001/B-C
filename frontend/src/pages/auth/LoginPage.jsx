import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Please enter a valid email or mobile number'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse redirect and expired query params (default to storefront '/')
  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = (!rawRedirect || rawRedirect === '/dashboard' || rawRedirect === '/dashboard/') ? '/' : rawRedirect;
  const isExpired = searchParams.get('expired') === '1';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    // Check for saved identifier
    const saved = localStorage.getItem('bc_saved_identifier');
    if (saved) {
      setValue('identifier', saved);
      setValue('rememberMe', true);
    }

    // Check for session expired toast
    if (isExpired) {
      toast.error('Session expired. Please log in again.');
    }
  }, [isExpired, setValue]);

  const onSubmit = async (data) => {
    setServerError('');
    if (data.rememberMe) {
      localStorage.setItem('bc_saved_identifier', data.identifier.trim());
    } else {
      localStorage.removeItem('bc_saved_identifier');
    }

    const result = await login(data.identifier.trim(), data.password);

    if (result.success) {
      toast.success(`Welcome back, ${result.user?.full_name || 'Champion'}!`);
      navigate(redirectPath, { replace: true });
    } else {
      let errorMsg = result.error || 'Invalid credentials. Please try again.';
      if (result.status === 429) {
        errorMsg = 'Too many attempts. Try again in 5 minutes.';
      }
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[420px] p-6 sm:p-8 shadow-lg border-slate-200 bg-white">
        {/* Brand header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group mb-2">
            <span className="text-3xl font-black tracking-tight text-primary-900 group-hover:opacity-90 transition-opacity">
              BIG<span className="text-accent-500">CHAMP</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Sign in to your account</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your orders, digital gear ecosystem, and dashboard.
          </p>
        </div>

        {/* Global Server Error Alert */}
        {serverError && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email or Mobile Field */}
          <Input
            label="Email or Mobile Number"
            placeholder="e.g. rahul@example.com or 9876543210"
            error={errors.identifier?.message}
            {...register('identifier')}
          />

          {/* Password with Eye Toggle */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-input"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-900 hover:text-primary-700 font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-primary-900 focus:ring-primary-600"
                {...register('rememberMe')}
              />
              <span className="text-xs text-slate-600">Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Bottom register link */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary-900 font-bold hover:underline"
          >
            Create free account
          </Link>
        </div>
      </Card>
    </div>
  );
}
