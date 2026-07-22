'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

type Step    = 'identifier' | 'otp' | 'reset';
type Method  = 'email' | 'phone';

const API = process.env.NEXT_PUBLIC_API_URL;

const COUNTRY_CODES = [
  { flag: '🇮🇳', code: '+91',  label: 'IN', maxLen: 10 },
  { flag: '🇺🇸', code: '+1',   label: 'US', maxLen: 10 },
  { flag: '🇬🇧', code: '+44',  label: 'GB', maxLen: 10 },
  { flag: '🇦🇪', code: '+971', label: 'AE', maxLen: 9  },
  { flag: '🇸🇦', code: '+966', label: 'SA', maxLen: 9  },
  { flag: '🇦🇺', code: '+61',  label: 'AU', maxLen: 9  },
  { flag: '🇨🇦', code: '+1',   label: 'CA', maxLen: 10 },
  { flag: '🇸🇬', code: '+65',  label: 'SG', maxLen: 8  },
];

const inputCls = 'w-full flex items-center gap-3 bg-[#f5f5f5] border border-[#d8d8d8] rounded-xl px-4 h-12 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/10 transition-all';
const fieldCls = 'flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none';
const errCls   = 'text-xs text-red-500 mt-1 ml-1';

const ErrMsg = ({ msg }: { msg?: string }) =>
  msg ? <p className={errCls}>{msg}</p> : null;

// Mask email: deepak@yopmail.com → de***@yopmail.com
const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

export default function ForgotPasswordPage() {
  const [step, setStep]         = useState<Step>('identifier');
  const [method, setMethod]     = useState<Method>('email');

  // Email
  const [email, setEmail]       = useState('');

  // Phone
  const [cc, setCc]             = useState(COUNTRY_CODES.find(c => c.code === '+1') || COUNTRY_CODES[0]);
  const [showCC, setShowCC]     = useState(false);
  const [phone, setPhone]       = useState('');

  // OTP + Reset
  const [otp, setOtp]           = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confPw, setConfPw]     = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [errs, setErrs]         = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [timer, setTimer]       = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ccRef    = useRef<HTMLDivElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ccRef.current && !ccRef.current.contains(e.target as Node)) setShowCC(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = () => {
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => { if (prev <= 1) { clearInterval(timerRef.current!); return 0; } return prev - 1; });
    }, 1000);
  };

  const fullPhone = () => cc.code + phone.replace(/\D/g, '');

  // -- Step 1: Send OTP --------------------------------------------
  const handleSendOtp = async () => {
    const e: Record<string, string> = {};

    if (method === 'email') {
      if (!email.trim())                 e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    } else {
      const digits = phone.replace(/\D/g, '');
      if (!digits)                         e.phone = 'Phone number is required';
      else if (digits.length < cc.maxLen)  e.phone = `Enter a valid ${cc.maxLen}-digit number`;
    }

    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    setLoading(true);

    try {
      const body = method === 'email' ? { email: email.trim() } : { phone: fullPhone() };
      const res  = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrs({ [method]: json.message || 'Something went wrong' });
        return;
      }
      toast.success(`OTP sent to your ${method === 'email' ? 'email' : 'phone'}!`);
      startTimer();
      setStep('otp');
    } catch {
      setErrs({ [method]: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  // -- Step 2: Verify OTP -----------------------------------------
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) { setErrs({ otp: 'Enter the 6-digit OTP' }); return; }
    setErrs({});
    setLoading(true);

    try {
      const body = method === 'email'
        ? { email: email.trim(), otp }
        : { phone: fullPhone(), otp };

      const res  = await fetch(`${API}/api/v1/auth/verify-forgot-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setErrs({ otp: json.message || 'Invalid OTP' }); return; }

      setResetToken(json.data?.reset_token || '');
      setStep('reset');
    } catch {
      setErrs({ otp: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  // -- Step 2: Resend OTP -----------------------------------------
  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const body = method === 'email' ? { email: email.trim() } : { phone: fullPhone() };
      const res  = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message || 'Could not resend OTP'); return; }
      toast.success('OTP resent!');
      setOtp('');
      startTimer();
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // -- Step 3: Reset Password -------------------------------------
  const handleReset = async () => {
    const e: Record<string, string> = {};
    if (!newPw)                    e.newPw  = 'New password is required';
    else if (newPw.length < 8)     e.newPw  = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(newPw)) e.newPw  = 'Must include at least one uppercase letter';
    else if (!/[0-9]/.test(newPw)) e.newPw  = 'Must include at least one number';
    if (newPw && confPw !== newPw) e.confPw = 'Passwords do not match';
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    setLoading(true);

    try {
      const res  = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPw }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message || 'Reset failed'); return; }
      toast.success('Password reset successfully!');
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // -- Step config ------------------------------------------------
  const steps = [
    { id: 'identifier', label: method === 'email' ? 'Email' : 'Phone', fa: method === 'email' ? 'fa-envelope' : 'fa-phone' },
    { id: 'otp',        label: 'Verify', fa: 'fa-shield'  },
    { id: 'reset',      label: 'Reset',  fa: 'fa-lock'    },
  ];
  const stepIdx = steps.findIndex((s) => s.id === step);

  // Info banner content for Step 2
  const otpSentTo = method === 'email'
    ? maskEmail(email)
    : `${cc.code} ${phone}`;

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Forgot password</h1>
        <p className="text-[#888888] text-sm mt-1">Reset your password in 3 simple steps</p>
      </div>

      {/* -- Step indicator -------------------------------- */}
      <div className="flex items-start justify-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1 w-16">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < stepIdx   ? 'bg-[#e84545] text-white' :
                i === stepIdx ? 'bg-[#e84545] text-white ring-4 ring-[#e84545]/20' :
                'bg-[#f0f0f0] text-[#888888] border border-[#d8d8d8]'
              }`}>
                {i < stepIdx ? <i className="fa fa-check" /> : <i className={`fa ${s.fa}`} />}
              </div>
              <span className={`text-xs font-medium ${i <= stepIdx ? 'text-[#e84545]' : 'text-[#888888]'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 rounded-full transition-all ${i < stepIdx ? 'bg-[#e84545]' : 'bg-[#d8d8d8]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* -- Step 1: Email or Phone ------------------------ */}
      {step === 'identifier' && (
        <div className="space-y-4">

          {/* Method tabs */}
          <div className="flex rounded-xl p-1 gap-1 bg-[#f0f0f0]">
            {(['email', 'phone'] as Method[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMethod(m); setErrs({}); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  method === m
                    ? 'bg-white text-[#e84545] shadow-sm'
                    : 'text-[#888888] hover:text-[#1a1a1a]'
                }`}
              >
                <i className={`fa ${m === 'email' ? 'fa-envelope' : 'fa-phone'} text-xs`} />
                {m === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          {/* Email input */}
          {method === 'email' && (
            <div>
              <div className={`${inputCls} ${errs.email ? 'border-red-400' : ''}`}>
                <i className="fa fa-envelope text-[#888888] text-sm" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldCls}
                />
              </div>
              <ErrMsg msg={errs.email} />
            </div>
          )}

          {/* Phone input */}
          {method === 'phone' && (
            <div>
              <div className={`${inputCls} ${errs.phone ? 'border-red-400' : ''}`}>
                {/* Country code dropdown */}
                <div className="relative flex-shrink-0" ref={ccRef}>
                  <button
                    type="button"
                    onClick={() => setShowCC(!showCC)}
                    className="text-xs font-semibold text-[#1a1a1a] bg-white rounded-lg px-2 py-1 border border-[#d8d8d8] flex items-center gap-1 hover:border-[#e84545] transition-colors flex-shrink-0"
                  >
                    {cc.label} {cc.code}
                    <i className={`fa fa-chevron-down text-[9px] text-gray-400 ml-0.5 transition-transform ${showCC ? 'rotate-180' : ''}`} />
                  </button>
                  {showCC && (
                    <div className="absolute top-10 left-0 z-50 bg-white border border-[#e8e8e8] rounded-xl shadow-lg py-1 w-44 max-h-52 overflow-y-auto">
                      {COUNTRY_CODES.map((c) => (
                        <button
                          key={c.label + c.code}
                          type="button"
                          onClick={() => { setCc(c); setShowCC(false); setPhone(''); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${cc.label === c.label ? 'text-[#e84545] font-semibold' : 'text-[#1a1a1a]'}`}
                        >
                          <span className="flex-1 text-left">{c.label}</span>
                          <span className="text-gray-400 text-xs">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-px h-5 bg-[#d8d8d8] flex-shrink-0" />
                <i className="fa fa-phone text-[#888888] text-sm" />
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={cc.maxLen}
                  className={fieldCls}
                />
                {phone.length > 0 && (
                  <span className="text-xs text-[#aaa] flex-shrink-0">{phone.length}/{cc.maxLen}</span>
                )}
              </div>
              <ErrMsg msg={errs.phone} />
            </div>
          )}

          <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp}>
            <i className="fa fa-paper-plane mr-2" />Send OTP
          </Button>
        </div>
      )}

      {/* -- Step 2: OTP ----------------------------------- */}
      {step === 'otp' && (
        <div className="space-y-1">
          <div className="bg-[#fff5f5] border border-[#e84545]/20 rounded-xl px-4 py-3 flex items-center gap-2 mb-3">
            <i className={`fa ${method === 'email' ? 'fa-envelope' : 'fa-mobile'} text-[#e84545] text-sm`} />
            <p className="text-xs text-[#444444]">
              OTP sent to <strong>{otpSentTo}</strong>
            </p>
          </div>
          <div className={`${inputCls} ${errs.otp ? 'border-red-400' : ''}`}>
            <i className="fa fa-key text-[#888888] text-sm" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className={`${fieldCls} text-center text-lg tracking-[0.5em] font-bold`}
            />
          </div>
          <ErrMsg msg={errs.otp} />
          <div className="pt-2 space-y-2">
            <Button fullWidth size="lg" loading={loading} onClick={handleVerifyOtp}>
              <i className="fa fa-check-circle mr-2" />Verify OTP
            </Button>
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep('identifier'); setOtp(''); setErrs({}); }}
                className="text-xs text-[#888888] hover:text-[#e84545] transition-colors"
              >
                <i className="fa fa-arrow-left mr-1" />Back
              </button>
              <button
                onClick={handleResend}
                disabled={timer > 0 || loading}
                className={`text-xs font-medium transition-colors ${timer > 0 ? 'text-[#aaa] cursor-not-allowed' : 'text-[#e84545] hover:text-[#c73333]'}`}
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Step 3: Reset ---------------------------------- */}
      {step === 'reset' && (
        <div className="space-y-1">
          <div className={`${inputCls} ${errs.newPw ? 'border-red-400' : ''}`}>
            <i className="fa fa-lock text-[#888888] text-sm" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={fieldCls}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="text-[#888888] hover:text-[#1a1a1a] flex-shrink-0">
              <i className={`fa ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
            </button>
          </div>
          <ErrMsg msg={errs.newPw} />

          <div className={`${inputCls} mt-3 ${errs.confPw ? 'border-red-400' : ''}`}>
            <i className="fa fa-lock text-[#888888] text-sm" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confPw}
              onChange={(e) => setConfPw(e.target.value)}
              className={fieldCls}
            />
          </div>
          <ErrMsg msg={errs.confPw} />

          <div className="pt-2">
            <Button fullWidth size="lg" loading={loading} onClick={handleReset}>
              <i className="fa fa-refresh mr-2" />Reset Password
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-[#888888] mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-[#e84545] hover:text-[#c73333] font-medium transition-colors">
          <i className="fa fa-sign-in mr-1" />Sign in
        </Link>
      </p>
    </>
  );
}
