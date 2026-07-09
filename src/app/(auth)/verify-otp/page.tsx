'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN:  '/admin/dashboard',
  SELLER: '/seller/dashboard',
  BUYER:  '/buyer/home',
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resending, setResend]  = useState(false);
  const [timer, setTimer]       = useState(60);
  const [email, setEmail]       = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Read email from cookie
  useEffect(() => {
    const e = Cookies.get('mc_verify_email') || '';
    setEmail(e);
    refs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }
    if (!email) { toast.error('Email not found. Please register again.'); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/v1/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp: code }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || 'Verification failed', { duration: 4000 });
        return;
      }

      // Update token + clear verify email cookie
      Cookies.set('mc_token',     json.data.token,        { expires: 7 });
      Cookies.set('mc_user_type', json.data.user?.role || json.data.role, { expires: 7 });
      Cookies.remove('mc_verify_email');

      toast.success('Email verified successfully!');
      const role = json.data.user?.role || json.data.role;
      router.push(ROLE_REDIRECT[role] || '/buyer/home');
    } catch {
      toast.error('Server unreachable. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Email not found'); return; }
    setResend(true);
    try {
      const res  = await fetch(`${API}/api/v1/auth/resend-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message || 'Failed to resend'); return; }
      toast.success('OTP resent to your email!');
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      refs.current[0]?.focus();
    } catch {
      toast.error('Server unreachable. Try again.');
    } finally {
      setResend(false);
    }
  };

  // Mask email: d***@yopmail.com
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c)
    : '';

  const filled = otp.filter(Boolean).length;

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%)', border: '1px solid #fca5a5' }}>
        <i className="fa fa-envelope text-3xl text-[#e84545]" />
      </div>

      <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">Verify your email</h1>
      <p className="text-[#888888] text-sm mb-1">We sent a 6-digit OTP to</p>
      <p className="text-[#1a1a1a] text-sm font-semibold mb-6">
        <i className="fa fa-envelope mr-1 text-[#e84545]" />{maskedEmail || 'your email'}
      </p>

      {/* OTP Boxes */}
      <div className="flex gap-2.5 justify-center mb-3" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="w-11 rounded-xl border-2 text-center text-lg font-bold text-[#1a1a1a] bg-[#f5f5f5] transition-all focus:outline-none focus:border-[#e84545] focus:bg-white focus:shadow-sm"
            style={{ height: '52px', borderColor: digit ? '#e84545' : '#d8d8d8' }}
          />
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-7">
        {otp.map((d, i) => (
          <div key={i} className="h-1 w-5 rounded-full transition-all duration-200"
            style={{ background: d ? '#e84545' : '#e0e0e0' }} />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || filled < 6}
        className="w-full h-12 rounded-xl bg-[#e84545] text-white font-bold text-sm hover:bg-[#c73333] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-5"
      >
        {loading
          ? <><i className="fa fa-spinner fa-spin" /> Verifying...</>
          : <><i className="fa fa-check-circle" /> Verify OTP</>
        }
      </button>

      <p className="text-sm text-[#888888]">
        Didn&apos;t receive the code?{' '}
        {timer > 0 ? (
          <span className="text-gray-400">Resend in <span className="font-semibold text-[#1a1a1a]">{timer}s</span></span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-[#e84545] hover:text-[#c73333] font-semibold transition-colors disabled:opacity-50"
          >
            {resending ? <><i className="fa fa-spinner fa-spin mr-1" />Sending...</> : 'Resend OTP'}
          </button>
        )}
      </p>
    </div>
  );
}
