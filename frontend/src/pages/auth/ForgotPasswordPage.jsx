import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { KeyRound, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
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
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword({
        identifier,
        otp: data.otp.trim(),
        new_password: data.newPassword,
      });

      toast.success('Password reset successfully! Please sign in.');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Check your OTP and try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 py-10 relative z-10">
      <div className="w-full max-w-[440px] p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.1)] text-white relative overflow-hidden">
        {/* Top ambient gold flare */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
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
            Reset Password
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 && 'Enter your registered email or mobile to receive a verification OTP.'}
            {step === 2 && `Enter the OTP sent to ${identifier} and set a new password.`}
            {step === 3 && 'Your password has been reset successfully!'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSubmitStep1(onSendOtp)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Email or Mobile Number
              </label>
              <input
                type="text"
                placeholder="e.g. rahul@example.com or 9876543210"
                className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                  errorsStep1.identifier
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-amber-400'
                }`}
                {...registerStep1('identifier', {
                  required: 'Email or mobile number is required',
                  minLength: { value: 3, message: 'Enter at least 3 characters' },
                })}
              />
              {errorsStep1.identifier && (
                <p className="text-xs text-red-400 mt-1">{errorsStep1.identifier.message}</p>
              )}
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
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmitStep2(onResetPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 123456"
                className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                  errorsStep2.otp
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-amber-400'
                }`}
                {...registerStep2('otp', {
                  required: 'Enter the 6-digit code',
                  minLength: { value: 4, message: 'Code must be at least 4 digits' },
                })}
              />
              {errorsStep2.otp && (
                <p className="text-xs text-red-400 mt-1">{errorsStep2.otp.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                New Password
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                  errorsStep2.newPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-amber-400'
                }`}
                {...registerStep2('newPassword', {
                  required: 'Enter new password',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              {errorsStep2.newPassword && (
                <p className="text-xs text-red-400 mt-1">{errorsStep2.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#02050b]/80 text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/25 ${
                  errorsStep2.confirmPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-white/15 focus:border-amber-400'
                }`}
                {...registerStep2('confirmPassword', {
                  required: 'Confirm your password',
                })}
              />
              {errorsStep2.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{errorsStep2.confirmPassword.message}</p>
              )}
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
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                &larr; Try another email / mobile
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-syne font-bold text-lg text-white">Password Updated!</h3>
            <p className="text-xs text-slate-400">
              Aapka password safaltapoorvak badal diya gaya hai. Kripya naye password se login karein.
            </p>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-syne font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30"
            >
              Sign In Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
