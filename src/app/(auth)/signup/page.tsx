'use client';
import { useState, useRef, useEffect } from 'react';
import { Spinner } from '@/components/ui/Loader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

type RoleType = 'SELLER' | 'BUYER';

/* ── shared styles ── */
const iBox  = 'w-full flex items-center gap-3 bg-[#f5f5f5] border border-[#d8d8d8] rounded-xl px-4 h-11 focus-within:border-[#e84545] focus-within:ring-2 focus-within:ring-[#e84545]/10 transition-all';
const iText = 'flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none';
const sel   = 'w-full h-11 bg-[#f5f5f5] border border-[#d8d8d8] rounded-xl px-4 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#e84545] transition-all appearance-none';
const lbl   = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1';

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 my-2.5">
    <div className="flex-1 h-px bg-[#eee]" /><span className="text-[11px] text-[#aaa]">{label}</span><div className="flex-1 h-px bg-[#eee]" />
  </div>
);
const GIcon = () => (<svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.107 17.64 11.8 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>);
const FIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>);

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

const COUNTRIES  = ['India','USA','UK','Canada','Australia','UAE','Singapore','Germany'];
const STATES     = ['Delhi','Maharashtra','Karnataka','Tamil Nadu','Gujarat','Rajasthan','Uttar Pradesh'];
const RANGES     = ['₹500–₹1,000/project','₹1,000–₹5,000/project','₹5,000–₹15,000/project','₹15,000–₹50,000/project','₹50,000+/project'];
const RANGE_RATE: Record<string, number> = {
  '₹500–₹1,000/project':     500,
  '₹1,000–₹5,000/project':   1000,
  '₹5,000–₹15,000/project':  5000,
  '₹15,000–₹50,000/project': 15000,
  '₹50,000+/project':         50000,
};
const RESP_TIMES = ['Within 1 hour','Within 6 hours','Within 24 hours','Within 48 hours','Within a week'];

const STEPS = [
  { label: 'Account',   icon: 'fa-user'      },
  { label: 'Profile',   icon: 'fa-id-card'   },
  { label: 'Portfolio', icon: 'fa-picture-o' },
];

export default function SignupPage() {
  const router       = useRouter();
  const resumeRef    = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);

  const [step, setStep]     = useState(1);
  const [role, setRole]     = useState<RoleType>('BUYER');
  const [loading, setLoading] = useState(false);

  // ── Categories from API ─────────────────────────────────
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`)
      .then(r => r.json())
      .then(json => {
        const names = (json.data || []).map((c: { name: string }) => c.name);
        if (names.length > 0) setCategoryTags(names);
      })
      .catch(() => {/* silent — no categories added yet */});
  }, []);

  /* Step 1 */
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [terms, setTerms]       = useState(false);
  const [smsOk, setSmsOk]       = useState(false);
  const [cc, setCc]             = useState(COUNTRY_CODES[0]);
  const [showCC, setShowCC]     = useState(false);
  const [errs, setErrs]         = useState<Record<string, string>>({});

  const setErr = (field: string, msg: string) => setErrs(p => ({ ...p, [field]: msg }));
  const clrErr = (field: string) => setErrs(p => { const n = { ...p }; delete n[field]; return n; });
  const ErrMsg = ({ field }: { field: string }) =>
    errs[field] ? <p className="text-[11px] text-red-500 mt-0.5 ml-1 flex items-center gap-1"><i className="fa fa-exclamation-circle" />{errs[field]}</p> : null;

  /* Step 2 */
  const [range, setRange]           = useState(RANGES[0]);
  const [dob, setDob]               = useState('');
  const [country, setCountry]       = useState('India');
  const [stateName, setStateName]   = useState('Delhi');
  const [city, setCity]             = useState('');
  const [zip, setZip]               = useState('');
  const [gender, setGender]         = useState('Male');
  const [category, setCategory]     = useState('');
  const [tags, setTags]             = useState<string[]>([]);
  const [bio, setBio]               = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [respTime, setRespTime]     = useState(RESP_TIMES[2]);

  /* Step 3 */
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioLink, setPortfolioLink]   = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);

  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  /* ── Submit to real API ── */
  const submit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email.trim());
      fd.append('password', password);
      fd.append('role', role);
      if (phone) fd.append('phone', cc.code + phone.replace(/\D/g, ''));

      if (role === 'SELLER') {
        fd.append('bio', bio);
        fd.append('skills', JSON.stringify(tags));
        fd.append('hourly_rate', String(RANGE_RATE[range] ?? 500));
        fd.append('city', city);
        fd.append('country', country);
        if (resumeFile) fd.append('resume', resumeFile);

        // Portfolio files — append each under same key 'portfolio_files'
        portfolioFiles.forEach(f => fd.append('portfolio_files', f));

        // Portfolio links — as JSON string
        if (portfolioLinks.length > 0) {
          fd.append('portfolio_links', JSON.stringify(portfolioLinks));
        }
      }
      // BUYER — no extra required fields

      // No Content-Type header — browser sets multipart/form-data with boundary automatically
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.errors?.[0]?.message || json.message || 'Registration failed', { duration: 4000 });
        return;
      }

      // Store auth token + email for verify-otp page
      Cookies.set('mc_token',        json.data.token,                       { expires: 7 });
      Cookies.set('mc_user_type',    json.data.user?.role || json.data.role, { expires: 7 });
      Cookies.set('mc_verify_email', email.trim(),                           { expires: 1 });

      toast.success('Account created! Check your email for OTP.');
      router.push('/verify-otp');
    } catch {
      toast.error('Server unreachable. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === 1) {
      const newErrs: Record<string, string> = {};
      if (!name.trim())                  newErrs.name     = 'Full name is required';
      if (!email.trim())                 newErrs.email    = 'Email address is required';
      if (!password)                     newErrs.password = 'Password is required';
      else if (password.length < 8)      newErrs.password = 'Min 8 characters';
      else if (!/[A-Z]/.test(password))  newErrs.password = 'Must have at least 1 uppercase letter';
      else if (!/[0-9]/.test(password))  newErrs.password = 'Must have at least 1 number';
      if (password && !confirm)          newErrs.confirm  = 'Please confirm your password';
      else if (confirm && password !== confirm) newErrs.confirm = "Passwords don't match";
      if (!terms)                        newErrs.terms    = 'Please accept Terms & Conditions';

      if (Object.keys(newErrs).length) { setErrs(newErrs); return; }
      setErrs({});
      if (role === 'BUYER') { submit(); return; }
      setStep(2); return;
    }
    if (step === 2) {
      if (role === 'SELLER') {
        if (!city)           { toast.error('City is required'); return; }
        if (tags.length < 1) { toast.error('Select at least one skill/tag'); return; }
      }
      setStep(3); return;
    }
    submit();
  };

  /* ── Step indicator ── */
  const StepBar = () => (
    <div className="mb-5">
      <div className="flex items-start justify-between relative mb-2">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#eee] mx-10 z-0" />
        {STEPS.map((s, i) => {
          const n = i + 1; const done = step > n; const active = step === n;
          return (
            <div key={s.label} className="flex flex-col items-center gap-1 flex-1 z-10">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                done   ? 'bg-green-500 border-green-500 text-white' :
                active ? 'bg-[#e84545] border-[#e84545] text-white' :
                         'bg-white border-[#d8d8d8] text-gray-400')}>
                {done ? <i className="fa fa-check text-xs" /> : <i className={`fa ${s.icon} text-xs`} />}
              </div>
              <span className={cn('text-[10px] font-semibold', active ? 'text-[#e84545]' : done ? 'text-green-500' : 'text-gray-400')}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 bg-[#f0f0f0] rounded-full mt-1">
        <div className="h-full bg-gradient-to-r from-[#e84545] to-[#c02a2a] rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
      </div>
    </div>
  );

  /* ══════════════════════════════ STEP 1 ══════════════════════════════ */
  if (step === 1) return (
    <>
      <div className="mb-3">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Create account</h1>
        <p className="text-[#888] text-xs mt-0.5">Join thousands of creators and buyers</p>
      </div>

      {/* Role */}
      <div className="grid grid-cols-2 gap-2.5 mb-2">
        {([
          { v: 'SELLER' as RoleType, label: 'Creator / Seller', desc: 'Offer services & earn money',   fa: 'fa-briefcase',    active: 'border-blue-500 bg-blue-50 text-blue-600'   },
          { v: 'BUYER'  as RoleType, label: 'Buyer / Client',   desc: 'Hire creators & get work done', fa: 'fa-shopping-bag', active: 'border-[#e84545] bg-[#fff5f5] text-[#e84545]'},
        ]).map(r => (
          <button key={r.v} type="button" onClick={() => setRole(r.v)}
            className={cn('flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border-2 transition-all',
              role === r.v ? r.active : 'border-[#d8d8d8] hover:border-gray-300 bg-white')}>
            <i className={`fa ${r.fa} text-xl`} />
            <div><p className="text-xs font-bold text-[#1a1a1a]">{r.label}</p><p className="text-[#aaa] text-[11px] leading-tight">{r.desc}</p></div>
          </button>
        ))}
      </div>

      <Divider label="continue with" />
      <div className="flex flex-col gap-2 mb-1">
        {[{ icon: <GIcon />, label: 'Continue with Google' }, { icon: <FIcon />, label: 'Continue with Facebook' }].map(s => (
          <button key={s.label} type="button" className="w-full flex items-center gap-3 h-10 px-4 rounded-xl border border-[#d8d8d8] bg-white hover:bg-gray-50 transition text-sm font-medium text-[#1a1a1a]">
            <span className="w-5 flex items-center justify-center">{s.icon}</span>{s.label}
          </button>
        ))}
      </div>

      <Divider label="or register below" />

      <div className="space-y-1.5">
        {/* Name */}
        <div>
          <div className={`${iBox} ${errs.name ? 'border-red-400 ring-2 ring-red-100' : ''}`}>
            <i className="fa fa-user text-[#aaa] text-xs" />
            <input placeholder="Full name *" value={name}
              onChange={e => { setName(e.target.value); clrErr('name'); }} className={iText} />
          </div>
          <ErrMsg field="name" />
        </div>

        {/* Email */}
        <div>
          <div className={`${iBox} ${errs.email ? 'border-red-400 ring-2 ring-red-100' : ''}`}>
            <i className="fa fa-envelope text-[#aaa] text-xs" />
            <input type="email" placeholder="Email address *" value={email}
              onChange={e => { setEmail(e.target.value); clrErr('email'); }} className={iText} />
          </div>
          <ErrMsg field="email" />
        </div>

        {/* Phone */}
        <div className={iBox} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setShowCC(!showCC)}
            className="flex items-center gap-1 text-xs font-semibold text-[#1a1a1a] bg-white rounded-lg px-2 py-1 border border-[#d8d8d8] flex-shrink-0 hover:border-[#e84545] transition-colors">
            {cc.flag} {cc.code}
            <i className="fa fa-chevron-down text-[9px] text-gray-400 ml-0.5" />
          </button>
          {showCC && (
            <div className="absolute top-12 left-0 z-50 bg-white border border-[#e8e8e8] rounded-xl shadow-lg py-1 w-44">
              {COUNTRY_CODES.map(c => (
                <button key={c.label} type="button"
                  onClick={() => { setCc(c); setShowCC(false); setPhone(''); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${cc.label === c.label ? 'text-[#e84545] font-semibold' : 'text-[#1a1a1a]'}`}>
                  <span>{c.flag}</span>
                  <span className="flex-1 text-left">{c.label}</span>
                  <span className="text-gray-400 text-xs">{c.code}</span>
                </button>
              ))}
            </div>
          )}
          <div className="w-px h-4 bg-[#d8d8d8] flex-shrink-0" />
          <i className="fa fa-phone text-[#aaa] text-xs" />
          <input type="tel" placeholder={`Phone number (${cc.maxLen} digits)`} value={phone}
            maxLength={cc.maxLen}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, cc.maxLen))}
            className={iText} />
          {phone.length > 0 && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">{phone.length}/{cc.maxLen}</span>
          )}
        </div>

        {/* Password */}
        <div>
          <div className={`${iBox} ${errs.password ? 'border-red-400 ring-2 ring-red-100' : ''}`}>
            <i className="fa fa-lock text-[#aaa] text-xs" />
            <input type={showPw ? 'text' : 'password'} placeholder="Password *" value={password}
              onChange={e => { setPassword(e.target.value); clrErr('password'); }} className={iText} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#aaa]">
              <i className={`fa ${showPw ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
            </button>
          </div>
          <ErrMsg field="password" />
        </div>

        {/* Confirm password */}
        <div>
          <div className={`${iBox} ${errs.confirm ? 'border-red-400 ring-2 ring-red-100' : ''}`}>
            <i className="fa fa-lock text-[#aaa] text-xs" />
            <input type={showPw ? 'text' : 'password'} placeholder="Confirm password *" value={confirm}
              onChange={e => { setConfirm(e.target.value); clrErr('confirm'); }} className={iText} />
          </div>
          <ErrMsg field="confirm" />
        </div>

        <label className="flex items-start gap-2 cursor-pointer pt-1">
          <input type="checkbox" checked={terms} onChange={e => { setTerms(e.target.checked); clrErr('terms'); }} className="mt-0.5 accent-[#e84545]" />
          <span className="text-xs text-gray-600">I Accept <span className="text-[#e84545] font-semibold">Terms &amp; Conditions</span></span>
        </label>
        {errs.terms && <p className="text-[11px] text-red-500 ml-1 flex items-center gap-1"><i className="fa fa-exclamation-circle" />{errs.terms}</p>}
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={smsOk} onChange={e => setSmsOk(e.target.checked)} className="mt-0.5 accent-[#e84545]" />
          <span className="text-xs text-gray-500 leading-tight">I consent to receive SMS messages for verification.</span>
        </label>

        <button onClick={next} disabled={loading}
          className="w-full h-11 rounded-xl bg-[#e84545] text-white text-sm font-bold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
          {loading ? <Spinner size="sm" color="white" /> : <i className="fa fa-arrow-right" />}
          {role === 'SELLER' ? 'Next: Profile Details' : 'Create Account'}
        </button>
      </div>

      <p className="text-center text-xs text-[#888] mt-3">Already have an account?{' '}
        <Link href="/login" className="text-[#e84545] font-medium"><i className="fa fa-sign-in mr-1" />Sign in</Link>
      </p>
    </>
  );

  /* ══════════════════════════════ STEP 2 ══════════════════════════════ */
  if (step === 2) return (
    <>
      <div className="mb-3">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Create account</h1>
        <p className="text-[#888] text-xs mt-0.5">Join thousands of creators and buyers</p>
      </div>
      <StepBar />

      {/* ── Scrollable form area ── */}
      <div className="max-h-[52vh] overflow-y-auto pr-1 -mr-1 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center"><i className="fa fa-id-card text-[#e84545] text-sm" /></div>
          <h3 className="text-sm font-bold text-gray-800">Profile Details</h3>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Price Range</label>
            <div className="relative">
              <select className={sel} value={range} onChange={e => setRange(e.target.value)}>{RANGES.map(r => <option key={r}>{r}</option>)}</select>
              <i className="fa fa-chevron-down absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={lbl}>Date of Birth</label>
            <input type="date" className={sel} value={dob} onChange={e => setDob(e.target.value)} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Country</label>
            <div className="relative">
              <select className={sel} value={country} onChange={e => setCountry(e.target.value)}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select>
              <i className="fa fa-chevron-down absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={lbl}>State</label>
            <div className="relative">
              <select className={sel} value={stateName} onChange={e => setStateName(e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}</select>
              <i className="fa fa-chevron-down absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>City *</label>
            <div className={iBox}><i className="fa fa-map-marker text-[#aaa] text-xs" /><input placeholder="City" value={city} onChange={e => setCity(e.target.value)} className={iText} /></div>
          </div>
          <div>
            <label className={lbl}>Zip Code</label>
            <div className={iBox}><i className="fa fa-hashtag text-[#aaa] text-xs" /><input placeholder="110001" value={zip} onChange={e => setZip(e.target.value)} className={iText} /></div>
          </div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Gender</label>
            <div className="relative">
              <select className={sel} value={gender} onChange={e => setGender(e.target.value)}>
                {['Male','Female','Other','Prefer not to say'].map(g => <option key={g}>{g}</option>)}
              </select>
              <i className="fa fa-chevron-down absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>
          {categoryTags.length > 0 && (
            <div>
              <label className={lbl}>Category</label>
              <div className="relative">
                <select className={sel} value={category} onChange={e => setCategory(e.target.value)}>
                  {categoryTags.map(c => <option key={c}>{c}</option>)}
                </select>
                <i className="fa fa-chevron-down absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className={lbl}>Tags / Skills *</label>
          <div className="flex flex-wrap gap-2 p-3 bg-[#f8f8f8] rounded-xl border border-[#e8e8e8] min-h-[52px]">
            {categoryTags.length === 0 ? (
              <p className="text-xs text-gray-400 italic self-center">Loading skills...</p>
            ) : categoryTags.map(t => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  tags.includes(t) ? 'bg-[#e84545] border-[#e84545] text-white shadow-sm' : 'bg-white border-[#d8d8d8] text-gray-500 hover:border-[#e84545] hover:text-[#e84545]')}>
                {tags.includes(t) && <i className="fa fa-check text-[8px] mr-1" />}{t}
              </button>
            ))}
          </div>
          {tags.length > 0 && <p className="text-[11px] text-[#e84545] mt-1 font-semibold"><i className="fa fa-check-circle mr-1" />{tags.length} selected</p>}
        </div>

        {/* Bio */}
        <div>
          <label className={lbl}>Bio</label>
          <textarea
            className="w-full bg-[#f5f5f5] border border-[#d8d8d8] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:border-[#e84545] resize-none h-20 transition"
            placeholder="Tell clients about yourself and your expertise..."
            value={bio} onChange={e => setBio(e.target.value)} />
        </div>

        {/* Resume + Response Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Resume / CV</label>
            <button type="button" onClick={() => resumeRef.current?.click()}
              className={cn(
                'w-full h-11 border border-dashed rounded-xl text-xs transition flex items-center justify-center gap-2',
                resumeName
                  ? 'border-green-400 text-green-600 bg-green-50'
                  : 'border-[#d8d8d8] text-gray-400 hover:border-[#e84545] hover:text-[#e84545]'
              )}>
              <i className={`fa ${resumeName ? 'fa-check-circle' : 'fa-paperclip'}`} />
              <span className="truncate max-w-[90px]">{resumeName || 'Upload PDF/DOC'}</span>
            </button>
            <input
              ref={resumeRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                setResumeFile(f || null);
                setResumeName(f?.name || '');
              }}
            />
          </div>
          <div>
            <label className={lbl}>Response Time</label>
            <div className="relative">
              <select className={sel} value={respTime} onChange={e => setRespTime(e.target.value)}>{RESP_TIMES.map(r => <option key={r}>{r}</option>)}</select>
              <i className="fa fa-chevron-down absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed bottom buttons ── */}
      <div className="flex gap-2 pt-4 mt-3 border-t border-gray-100">
        <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border border-[#d8d8d8] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
          <i className="fa fa-arrow-left mr-1.5" />Back
        </button>
        <button onClick={next} className="flex-[2] h-11 rounded-xl bg-[#e84545] text-white text-sm font-bold hover:bg-[#c73333] transition shadow-sm">
          Next: Portfolio <i className="fa fa-arrow-right ml-1.5" />
        </button>
      </div>
    </>
  );

  /* ══════════════════════════════ STEP 3 ══════════════════════════════ */
  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Create account</h1>
        <p className="text-[#888] text-xs mt-0.5">Join thousands of creators and buyers</p>
      </div>
      <StepBar />

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center"><i className="fa fa-picture-o text-[#e84545] text-sm" /></div>
          <h3 className="text-sm font-bold text-gray-800">Portfolio</h3>
          <span className="ml-auto text-xs text-gray-400 font-medium">Optional</span>
        </div>

        <p className="text-xs text-gray-400">Showcase your best work to attract more clients.</p>

        {/* Upload area */}
        <button type="button" onClick={() => portfolioRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-[#d8d8d8] rounded-2xl text-gray-400 hover:border-[#e84545] hover:text-[#e84545] transition flex flex-col items-center justify-center gap-2 bg-gray-50">
          <i className="fa fa-cloud-upload text-2xl" />
          <span className="text-xs font-semibold">Upload images, videos or files</span>
          <span className="text-[11px] text-gray-400">JPG, PNG, PDF, MP4 (max 20MB each)</span>
        </button>
        <input ref={portfolioRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden"
          onChange={e => setPortfolioFiles(p => [...p, ...Array.from(e.target.files || [])])} />

        {portfolioFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {portfolioFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">
                <i className="fa fa-file text-[#e84545]" />{f.name}
                <button type="button" onClick={() => setPortfolioFiles(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-0.5"><i className="fa fa-times" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Link input */}
        <div>
          <label className={lbl}>Portfolio Links</label>
          <div className="flex gap-2">
            <div className={iBox + ' flex-1'}>
              <i className="fa fa-link text-[#aaa] text-xs" />
              <input placeholder="https://behance.net/yourwork" value={portfolioLink} onChange={e => setPortfolioLink(e.target.value)} className={iText}
                onKeyDown={e => { if (e.key === 'Enter' && portfolioLink) { setPortfolioLinks(p => [...p, portfolioLink]); setPortfolioLink(''); } }} />
            </div>
            <button type="button" onClick={() => { if (portfolioLink) { setPortfolioLinks(p => [...p, portfolioLink]); setPortfolioLink(''); } }}
              className="h-11 px-4 bg-[#e84545] text-white rounded-xl text-sm font-bold hover:bg-[#c73333] transition flex-shrink-0">
              <i className="fa fa-plus" />
            </button>
          </div>
        </div>

        {portfolioLinks.length > 0 && (
          <div className="space-y-1.5">
            {portfolioLinks.map((l, i) => (
              <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <i className="fa fa-external-link text-blue-400 text-xs" />
                <span className="text-xs text-blue-600 flex-1 truncate">{l}</span>
                <button type="button" onClick={() => setPortfolioLinks(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><i className="fa fa-times text-xs" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl border border-[#d8d8d8] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            <i className="fa fa-arrow-left mr-1.5" />Back
          </button>
          <button onClick={next} disabled={loading}
            className="flex-[2] h-11 rounded-xl bg-[#e84545] text-white text-sm font-bold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" color="white" /> : <i className="fa fa-check" />}
            Submit Profile
          </button>
        </div>
      </div>
    </>
  );
}
