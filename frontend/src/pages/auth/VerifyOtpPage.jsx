import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShieldCheck, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';

export default function VerifyOtpPage() {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const inputsRef = useRef([]);
  const navigate = useNavigate();

  // Read stored registration data
  const regData = JSON.parse(localStorage.getItem('bc_reg_tmp') || 'null');
  const identifier = regData?.identifier || '';
  const devOtp = regData?.devOtp;

  useEffect(() => {
    if (!identifier) {
      toast.error('Please initiate registration first.');
      navigate('/register', { replace: true });
      return;
    }

    inputsRef.current[0]?.focus();

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [identifier, navigate]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);
    setErrorMsg('');

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg('');

    try {
      const response = await authService.sendOtp(identifier, 'REGISTER');
      const newDevOtp = response.data.dev_otp || response.data.mock_otp;

      if (newDevOtp) {
        toast.success(`New OTP sent! (Dev Code: ${newDevOtp})`, { duration: 6000 });
        const updated = { ...regData, devOtp: newDevOtp };
        localStorage.setItem('bc_reg_tmp', JSON.stringify(updated));
      } else {
        toast.success('A fresh verification code has been dispatched.');
      }
      setCooldown(60);
      setOtpValues(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend OTP. Please wait a moment.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');

    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await authService.verifyOtp(identifier, fullOtp, 'REGISTER');
      toast.success('Verification successful!');
      navigate('/register/password');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid verification code. Please try again.';
      setErrorMsg(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 py-10 relative z-10">
      <div
        className={`w-full max-w-[440px] p-7 sm:p-9 rounded-3xl bg-[#060b16]/85 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.1)] text-white relative overflow-hidden ${
          shake ? 'animate-bounce' : ''
        }`}
      >
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
            Verify Your Code
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            We sent a 6-digit code to <span className="font-bold text-amber-400">{identifier}</span>
          </p>
        </div>

        {/* Development Mode Helper Banner */}
        {devOtp && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div>
              <span className="font-bold">Dev Code: </span>
              <span className="font-mono text-sm tracking-widest bg-amber-500/20 px-2 py-0.5 rounded font-bold text-amber-200">
                {devOtp}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const digits = devOtp.split('').slice(0, 6);
                setOtpValues(digits);
              }}
              className="text-xs font-bold text-amber-400 underline hover:text-amber-300 cursor-pointer"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otpValues.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-xl font-black rounded-xl border border-white/20 bg-[#02050b]/80 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-center text-red-400 font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-syne font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Confirm &amp; Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Option */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
          {cooldown > 0 ? (
            <span>Resend available in <strong className="text-amber-400 font-mono">{cooldown}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-amber-400 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
