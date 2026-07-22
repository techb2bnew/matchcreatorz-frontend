'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/slices/authSlice';
import GoogleAuthBox from '@/components/auth/GoogleAuthBox';
import toast from 'react-hot-toast';
import type { UserRole } from '@/types';

const roleRedirect: Record<UserRole, string> = {
  ADMIN:  '/admin/dashboard',
  SELLER: '/seller/dashboard',
  BUYER:  '/buyer/home',
};

const COUNTRY_CODES = [
  { flag: '🇮🇳', code: '+91',  label: 'IN' },
  { flag: '🇺🇸', code: '+1',   label: 'US' },
  { flag: '🇬🇧', code: '+44',  label: 'GB' },
  { flag: '🇦🇪', code: '+971', label: 'AE' },
  { flag: '🇸🇦', code: '+966', label: 'SA' },
  { flag: '🇦🇺', code: '+61',  label: 'AU' },
  { flag: '🇨🇦', code: '+1',   label: 'CA' },
  { flag: '🇸🇬', code: '+65',  label: 'SG' },
];

const inputCls = 'w-full flex items-center gap-3 bg-[#f5f5f5] border border-[#d8d8d8] rounded-xl px-4 h-11 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/10 transition-all';
const fieldCls = 'flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none';

const ErrMsg = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-500 mt-1 ml-1">{msg}</p> : null;

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 my-3">
    <div className="flex-1 h-px bg-[#e8e8e8]" />
    <span className="text-[11px] text-[#aaa]">{label}</span>
    <div className="flex-1 h-px bg-[#e8e8e8]" />
  </div>
);


export default function LoginPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);

  const [tab, setTab]           = useState<'phone' | 'email'>('phone');
  const [showPw, setShowPw]     = useState(false);
  const [showCC, setShowCC]     = useState(false);
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry]   = useState(COUNTRY_CODES.find(c => c.code === '+1') || COUNTRY_CODES[0]);
  const [errs, setErrs]         = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // -- Inline validation -----------------------
    const e2: Record<string, string> = {};
    if (tab === 'email') {
      if (!email.trim())                       e2.email    = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email))   e2.email    = 'Enter a valid email address';
    } else {
      if (!phone.trim())                       e2.phone    = 'Phone number is required';
    }
    if (!password)                             e2.password = 'Password is required';
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setErrs({});

    const payload = tab === 'email'
      ? { email: email.trim(), password }
      : { phone: phone.trim(), countryCode: country.code, password };

    const result = await dispatch(loginUser(payload));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      const role = (result.payload as { user: { type: UserRole } }).user.type;
      router.push(roleRedirect[role]);
    } else {
      toast.error((result.payload as string) || 'Login failed', { duration: 4000 });
    }
  };

  return (
    <>
      {/* Title */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Welcome back</h1>
        <p className="text-[#888888] text-xs mt-0.5">Sign in to your account to continue</p>
      </div>

      {/* Social Login */}
      <GoogleAuthBox />

      <Divider label="or sign in manually" />

      {/* Tabs */}
      <div className="flex bg-[#f0f0f0] rounded-xl p-1 mb-3">
        {(['phone', 'email'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-[#e84545] text-white shadow-sm' : 'text-[#888888] hover:text-[#1a1a1a]'}`}>
            <i className={`fa ${t === 'phone' ? 'fa-phone' : 'fa-envelope'} mr-1.5`} />
            {t === 'phone' ? 'Phone' : 'Email'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-2.5">

        {tab === 'phone' ? (
          <div>
            <div className={`${inputCls} ${errs.phone ? 'border-red-400' : ''}`} style={{ position: 'relative' }}>
              {/* Country code selector */}
              <button type="button" onClick={() => setShowCC(!showCC)}
                className="flex items-center gap-1 text-xs font-semibold text-[#1a1a1a] bg-white rounded-lg px-2 py-1 border border-[#d8d8d8] flex-shrink-0 hover:border-[#e84545] transition-colors">
                {country.flag} {country.code}
                <i className="fa fa-chevron-down text-[9px] text-gray-400 ml-0.5" />
              </button>

              {/* Dropdown */}
              {showCC && (
                <div className="absolute top-12 left-0 z-50 bg-white border border-[#e8e8e8] rounded-xl shadow-lg py-1 w-44">
                  {COUNTRY_CODES.map((c) => (
                    <button key={c.label + c.code} type="button"
                      onClick={() => { setCountry(c); setShowCC(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${country.code === c.code && country.label === c.label ? 'text-[#e84545] font-semibold' : 'text-[#1a1a1a]'}`}>
                      <span>{c.flag}</span>
                      <span className="flex-1 text-left">{c.label}</span>
                      <span className="text-gray-400 text-xs">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="w-px h-4 bg-[#d8d8d8] flex-shrink-0" />
              <i className="fa fa-phone text-[#888888] text-xs" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className={fieldCls}
              />
            </div>
            <ErrMsg msg={errs.phone} />
          </div>
        ) : (
          <div>
            <div className={`${inputCls} ${errs.email ? 'border-red-400' : ''}`}>
              <i className="fa fa-envelope text-[#888888] text-xs" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldCls}
              />
            </div>
            <ErrMsg msg={errs.email} />
          </div>
        )}

        <div>
          <div className={`${inputCls} ${errs.password ? 'border-red-400' : ''}`}>
            <i className="fa fa-lock text-[#888888] text-xs" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldCls}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="text-[#888888] hover:text-[#1a1a1a] transition-colors flex-shrink-0">
              <i className={`fa ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
            </button>
          </div>
          <ErrMsg msg={errs.password} />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-[#e84545] hover:text-[#c73333] transition-colors">
            <i className="fa fa-question-circle mr-1" />Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          <i className="fa fa-sign-in mr-2" />Sign In
        </Button>
      </form>

      <p className="text-center text-xs text-[#888888] mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#e84545] hover:text-[#c73333] font-medium transition-colors">Sign up</Link>
      </p>
    </>
  );
}
