import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
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

  const regData = JSON.parse(localStorage.getItem('bc_reg_tmp') || 'null');
  const identifier = regData?.identifier || '';
  const channel = regData?.channel || 'email';

  const isEmailChannel = channel === 'email';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const watchPassword = watch('password', '');

  useEffect(() => {
    if (!identifier) {
      toast.error('Session expired. Please restart registration.');
      navigate('/register', { replace: true });
      return;
    }

    if (isEmailChannel) {
      setValue('email', identifier);
    } else {
      setValue('mobile', identifier);
    }
  }, [identifier, isEmailChannel, navigate, setValue]);

  const passwordRules = [
    { label: 'At least 8 characters', valid: watchPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(watchPassword) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(watchPassword) },
    { label: 'One number (0-9)', valid: /\d/.test(watchPassword) },
  ];

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        mobile: data.mobile.trim(),
        password: data.password,
      };

      const response = await authService.register(payload);
      const { user, token } = response.data;

      setAuth(user, token);
      localStorage.removeItem('bc_reg_tmp');

      toast.success(`Account created! Welcome to BigChamp, ${user.full_name}!`);
      navigate('/register/success', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check inputs.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 py-10 relative z-10">
      <div className="w-full max-w-[480px] p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.1)] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
            <img
              src="/assets/logo.png"
              alt="Bigchamp Brand Crest"
              className="h-9 w-auto filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex flex-col text-left">
              <span className="font-syne font-black text-xl tracking-[1.5px] text-white flex items-center gap-1 leading-none">
                BIG<span className="text-amber-400">CHAMP</span>
              </span>
              <span className="text-[9px] font-mono tracking-[1.5px] uppercase text-slate-400 mt-0.5">
                Born to Win
              </span>
            </div>
          </Link>

          <h1 className="font-syne font-black text-2xl text-white tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Set up your name and secure password to activate your BigChamp identity.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                errors.full_name ? 'border-red-500' : 'border-white/15 focus:border-amber-400'
              }`}
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              placeholder="rahul@example.com"
              disabled={isEmailChannel}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                isEmailChannel ? 'opacity-70 bg-slate-900/50' : ''
              } ${errors.email ? 'border-red-500' : 'border-white/15 focus:border-amber-400'}`}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Mobile Number (10 Digits)
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="9876543210"
              disabled={!isEmailChannel}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                !isEmailChannel ? 'opacity-70 bg-slate-900/50' : ''
              } ${errors.mobile ? 'border-red-500' : 'border-white/15 focus:border-amber-400'}`}
              {...register('mobile')}
            />
            {errors.mobile && (
              <p className="text-xs text-red-400 mt-1">{errors.mobile.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                className={`w-full px-4 py-3 pr-11 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                  errors.password ? 'border-red-500' : 'border-white/15 focus:border-amber-400'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                className={`w-full px-4 py-3 pr-11 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-white/15 focus:border-amber-400'
                }`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-400 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Password Strength Checklist */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
              Security Checklist:
            </div>
            {passwordRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    rule.valid ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                />
                <span className={rule.valid ? 'text-slate-200' : 'text-slate-500'}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-syne font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
