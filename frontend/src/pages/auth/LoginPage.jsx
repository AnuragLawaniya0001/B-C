import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
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
    const saved = localStorage.getItem('bc_saved_identifier');
    if (saved) {
      setValue('identifier', saved);
      setValue('rememberMe', true);
    }

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
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 py-10 relative z-10">
      <div className="w-full max-w-[440px] p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.1)] text-white relative overflow-hidden">
        {/* Top ambient cyan flare */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group mb-3">
            <img
              src="/assets/logo_emblem.png"
              alt="BIGCHAMP Winged Crest"
              className="h-10 w-auto filter drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 font-display italic leading-tight">
                BIGCHAMP
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-cyan-400 -mt-0.5 font-bold">
                Sports Commerce
              </span>
            </div>
          </Link>

          <h1 className="font-syne font-black text-2xl text-white tracking-tight">
            Sign In to Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your orders, digital gear ecosystem, and athlete dashboard.
          </p>
        </div>

        {/* Global Server Error Alert */}
        {serverError && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email or Mobile Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email or Mobile Number
            </label>
            <input
              type="text"
              placeholder="e.g. rahul@example.com or 9876543210"
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${errors.identifier
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-white/15 focus:border-amber-400'
                }`}
              {...register('identifier')}
            />
            {errors.identifier && (
              <p className="text-xs text-red-400 mt-1">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password with Eye Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-11 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${errors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-amber-400'
                  }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-0"
                {...register('rememberMe')}
              />
              <span className="text-xs text-slate-400">Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-500 text-slate-950 font-syne font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info & link */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-cyan-400 font-bold hover:underline ml-1"
          >
            Create free account &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
