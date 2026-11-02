import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShoppingBag,
  Gift,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const registrationSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long'),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)'),
    email: z
      .string()
      .email('Enter a valid email address (e.g. name@example.com)'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    referral_code: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      referral_code: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        mobile: data.mobile.trim(),
        password: data.password,
        referral_code: data.referral_code?.trim() || undefined,
      };

      const response = await authService.register(payload);
      const resData = response.data || response;
      const user = resData.user;
      const accessToken = resData.access_token || resData.token;
      const refreshToken = resData.refresh_token;

      if (user && accessToken) {
        setAuth(user, accessToken, refreshToken);
      }

      toast.success(`Account created! Welcome to BIGCHAMP, ${user?.full_name || 'Champion'}!`, {
        duration: 5000,
      });

      // Navigate to store or welcome page
      navigate('/store', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Registration failed. Please check your details and try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 py-10 relative z-10">
      <div className="w-full max-w-[500px] p-6 sm:p-9 rounded-3xl bg-[#030712]/90 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(0,240,255,0.08)] text-white relative overflow-hidden">
        {/* Subtle top ambient glow */}
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
            Create Customer Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Free sports shopping account. Track orders, explore gear, and enjoy member offers.
          </p>
        </div>

        {/* Direct Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-[#050b14] text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${
                  errors.full_name
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-cyan-400'
                }`}
                {...register('full_name')}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.full_name && (
              <p className="text-red-400 text-[11px] mt-0.5">{errors.full_name.message}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Mobile Number
            </label>
            <div className="relative flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/15 bg-white/5 text-slate-300 text-xs font-mono font-bold">
                +91
              </span>
              <div className="relative flex-1">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-r-xl border bg-[#050b14] text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${
                    errors.mobile
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-white/15 focus:border-cyan-400'
                  }`}
                  {...register('mobile')}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            {errors.mobile && (
              <p className="text-red-400 text-[11px] mt-0.5">{errors.mobile.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="rahul.sharma@example.com"
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-[#050b14] text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-cyan-400'
                }`}
                {...register('email')}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.email && (
              <p className="text-red-400 text-[11px] mt-0.5">{errors.email.message}</p>
            )}
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 chars"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-[#050b14] text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-white/15 focus:border-cyan-400'
                  }`}
                  {...register('password')}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-[11px] mt-0.5">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Confirm
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-[#050b14] text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-white/15 focus:border-cyan-400'
                  }`}
                  {...register('confirmPassword')}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-[11px] mt-0.5">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Referral Code (Optional accordion) */}
          <div className="pt-1">
            {!showReferralInput ? (
              <button
                type="button"
                onClick={() => setShowReferralInput(true)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Have a referral code? (Optional)</span>
              </button>
            ) : (
              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Referral Code (Optional)</span>
                  <button
                    type="button"
                    onClick={() => setShowReferralInput(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Hide
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BC123ABC"
                  className="w-full px-4 py-2 text-xs rounded-xl border border-white/15 bg-[#050b14] text-white uppercase placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  {...register('referral_code')}
                />
              </div>
            )}
          </div>

          {/* Account Tier Distinction Pill */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Normal Customer Account</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 font-bold border border-cyan-400/20">
                100% Free
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Immediate access to sports catalog, orders, and free express shipping above ₹500. VIP Athlete Pass can be activated anytime from your account.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-cyan-500 text-slate-950 font-syne font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer / Login Link */}
        <div className="text-center mt-6 pt-5 border-t border-white/10">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline ml-1 inline-flex items-center gap-0.5"
            >
              Sign In here &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
