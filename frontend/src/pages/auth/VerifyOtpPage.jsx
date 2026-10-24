import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShieldCheck, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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

    // Auto-focus first input
    inputsRef.current[0]?.focus();

    // 60-second cooldown countdown
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [identifier, navigate]);

  const handleChange = (index, value) => {
    // Only accept numeric digit
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtpValues(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg('');

    try {
      const res = await authService.sendOtp(identifier, 'REGISTER');
      const newDevOtp = res.data.dev_otp || res.data.mock_otp;

      // Update stored registration temp data with new dev OTP
      localStorage.setItem(
        'bc_reg_tmp',
        JSON.stringify({
          ...regData,
          devOtp: newDevOtp,
        })
      );

      setCooldown(60);
      setOtpValues(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();

      if (newDevOtp) {
        toast.success(`New OTP sent! (Dev Code: ${newDevOtp})`, { duration: 6000 });
      } else {
        toast.success('A new verification code has been sent!');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend OTP.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
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
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50/50">
      <Card className="w-full max-w-[440px] p-6 sm:p-8 shadow-lg border-slate-200 bg-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-900 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verify your code</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            We sent a 6-digit verification code to
          </p>
          <p className="text-sm font-bold text-primary-900 mt-0.5">{identifier}</p>
        </div>

        {/* Development Mode Helper Banner */}
        {devOtp && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <div>
              <span className="font-bold">Dev Mode OTP: </span>
              <span className="font-mono text-sm tracking-widest bg-amber-100 px-2 py-0.5 rounded font-bold">
                {devOtp}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const digits = devOtp.split('').slice(0, 6);
                setOtpValues(digits);
              }}
              className="text-xs font-semibold text-amber-900 underline hover:opacity-80"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 Digit Inputs */}
          <div
            className={`flex justify-between gap-2 sm:gap-3 ${
              shake ? 'animate-bounce' : ''
            }`}
          >
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-11 sm:w-12 h-13 sm:h-14 text-center text-xl font-bold rounded-xl border bg-slate-50/50 transition-all focus:bg-white focus:outline-none focus:ring-2 ${
                  errorMsg
                    ? 'border-red-400 text-red-900 focus:ring-red-200'
                    : 'border-slate-300 text-slate-900 focus:border-primary-600 focus:ring-primary-100'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-xs font-medium text-center text-red-600">{errorMsg}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Verify & Continue
          </Button>

          {/* Resend Cooldown */}
          <div className="text-center pt-2">
            {cooldown > 0 ? (
              <p className="text-xs text-slate-500">
                Resend code in{' '}
                <span className="font-semibold text-slate-700">{cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-900 hover:text-primary-700 hover:underline disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`}
                />
                <span>Resend verification code</span>
              </button>
            )}
          </div>
        </form>

        {/* Change Identifier */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Incorrect details?{' '}
          <Link
            to="/register"
            className="text-primary-900 font-semibold hover:underline"
          >
            Change identifier
          </Link>
        </div>
      </Card>
    </div>
  );
}
