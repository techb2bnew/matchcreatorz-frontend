'use client';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'security' | 'bank';
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'profile',  label: 'Profile',      icon: 'fa-user'       },
  { key: 'security', label: 'Security',     icon: 'fa-shield'     },
  { key: 'bank',     label: 'Bank Details', icon: 'fa-university' },
];

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

export default function SellerAccountPage() {
  const { user } = useAppSelector((s) => s.auth);
  const initials = (user?.fullName || 'AJ').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [form, setForm] = useState({
    fullName: user?.fullName || 'Alex Johnson',
    email: user?.email || 'seller@matchcreatorz.com',
    phone: user?.phone || '9876543210',
    bio: 'Professional content creator with 5+ years of experience in digital marketing and brand storytelling.',
    category: 'Digital Marketing',
    location: 'Mumbai, India',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [bank, setBank] = useState({ accountNo: '****1234', ifsc: 'HDFC0001234', bankName: 'HDFC Bank', upi: 'alex@upi' });
  const [profSaved, setProfSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  const stats = [
    { label: 'Connects',   val: user?.totalConnects || 25,            icon: 'fa-link',      color: '#4f9ef8' },
    { label: 'Earnings',   val: `₹${(user?.totalEarningAmount||12500).toLocaleString()}`, icon: 'fa-money',     color: '#10b981' },
    { label: 'Jobs Done',  val: user?.totalCompletedJobs || 8,        icon: 'fa-check',     color: '#e84545' },
    { label: 'Rating',     val: `${user?.avgRating || 4.7}★`,         icon: 'fa-star',      color: '#f59e0b' },
  ];

  return (
    <DashboardLayout role="SELLER" title="My Account">
      <div className="space-y-5">

        {/* ── Banner Card ── */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden">
          <div className="h-32 w-full relative" style={{ background: 'linear-gradient(135deg,#e84545 0%,#c02a2a 100%)' }}>
            <div className="absolute -bottom-10 left-8">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center bg-[#e84545]">
                  <span className="text-white text-2xl font-bold">{initials}</span>
                </div>
                <button className="absolute -bottom-1 -right-1 h-7 w-7 bg-white border border-[#e8e8e8] shadow-sm rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition">
                  <i className="fa fa-camera text-gray-500 text-xs" />
                </button>
              </div>
            </div>
          </div>
          <div className="pt-12 pb-5 px-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{form.fullName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{form.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#4f9ef8] border border-blue-200">
                <i className="fa fa-briefcase" /> Seller
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {stats.map(s => (
                <div key={s.label} className="border-l border-gray-100 pl-5 ml-5 first:border-0 first:pl-0 first:ml-0 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <i className={`fa ${s.icon} text-xs`} style={{ color: s.color }} />
                    <p className="text-sm font-bold text-gray-800">{s.val}</p>
                  </div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white border border-[#e8e8e8] shadow-sm p-1 rounded-2xl w-fit flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === t.key ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              )}>
              <i className={`fa ${t.icon}`} />{t.label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fa fa-user text-[#e84545]" /> Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full Name</label>
                  <input className={inputCls} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {['Digital Marketing','Content Writing','Web Development','Graphic Design','Video Editing','Photography'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Bio</label>
                  <textarea className={inputCls + ' h-24 resize-none py-3'} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                <button onClick={() => { setProfSaved(true); setTimeout(() => setProfSaved(false), 2500); }}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm">
                  <i className="fa fa-save" /> Save Profile
                </button>
                {profSaved && <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium"><i className="fa fa-check-circle" /> Saved!</span>}
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><i className="fa fa-bar-chart text-[#e84545]" /> Performance</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Profile Complete', val: 85, color: '#e84545' },
                    { label: 'Response Rate',    val: 92, color: '#10b981' },
                    { label: 'Job Success',      val: 96, color: '#4f9ef8' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{m.label}</span>
                        <span className="font-semibold text-gray-800">{m.val}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${m.val}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i className="fa fa-id-card text-[#e84545]" /> Account Info</h4>
                {[
                  { icon: 'fa-id-badge',   color: '#e84545', label: 'Seller ID',    val: `#SLR-${user?.id || '002'}` },
                  { icon: 'fa-calendar',   color: '#4f9ef8', label: 'Joined',       val: 'Jan 2024'                  },
                  { icon: 'fa-check-circle', color: '#10b981', label: 'Verified',   val: 'Email & Phone'             },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: r.color + '15' }}>
                      <i className={`fa ${r.icon} text-xs`} style={{ color: r.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{r.label}</p>
                      <p className="text-xs font-semibold text-gray-800">{r.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-lock text-[#e84545]" /> Change Password</h3>
              <p className="text-xs text-gray-400 mb-5">Keep your account secure with a strong password</p>
              <div className="space-y-4">
                {[
                  { key: 'current', label: 'Current Password', show: showCur, toggle: () => setShowCur(v => !v) },
                  { key: 'newPass', label: 'New Password',     show: showNew, toggle: () => setShowNew(v => !v) },
                  { key: 'confirm', label: 'Confirm Password', show: showCon, toggle: () => setShowCon(v => !v) },
                ].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <div className="relative">
                      <input className={inputCls + ' pr-10'} type={f.show ? 'text' : 'password'} placeholder={f.label}
                        value={passwords[f.key as keyof typeof passwords]}
                        onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))} />
                      <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className={`fa ${f.show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                  <i className="fa fa-info-circle mr-1.5" />Use at least 8 characters including uppercase, numbers, and symbols.
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => { setPwSaved(true); setPasswords({ current:'', newPass:'', confirm:'' }); setTimeout(() => setPwSaved(false), 2500); }}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm">
                    <i className="fa fa-shield" /> Update Password
                  </button>
                  {pwSaved && <span className="flex items-center gap-1.5 text-green-600 text-sm"><i className="fa fa-check-circle" /> Updated!</span>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-desktop text-[#e84545]" /> Active Sessions</h3>
              <p className="text-xs text-gray-400 mb-5">Devices currently logged in</p>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows', location: 'Mumbai, India',  time: 'Active now',  icon: 'fa-chrome',  current: true  },
                  { device: 'Safari on iPhone',  location: 'Delhi, India',   time: '3 hours ago', icon: 'fa-mobile',  current: false },
                  { device: 'Firefox on Mac',    location: 'Pune, India',    time: '2 days ago',  icon: 'fa-firefox', current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#e8e8e8] shadow-sm flex items-center justify-center flex-shrink-0">
                      <i className={`fa ${s.icon} text-gray-500 text-lg`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{s.device}</p>
                      <p className="text-xs text-gray-400 mt-0.5"><i className="fa fa-map-marker mr-1" />{s.location} · {s.time}</p>
                    </div>
                    {s.current
                      ? <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Current</span>
                      : <button className="text-xs text-[#e84545] hover:underline font-medium">Revoke</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Bank Details Tab ── */}
        {activeTab === 'bank' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-university text-[#e84545]" /> Bank Account</h3>
              <p className="text-xs text-gray-400 mb-5">Your payout bank details</p>
              <div className="space-y-4">
                {[
                  { key: 'bankName',  label: 'Bank Name',      icon: 'fa-university', placeholder: 'e.g. HDFC Bank'    },
                  { key: 'accountNo', label: 'Account Number', icon: 'fa-credit-card', placeholder: 'Enter account no' },
                  { key: 'ifsc',      label: 'IFSC Code',      icon: 'fa-barcode',    placeholder: 'e.g. HDFC0001234'  },
                  { key: 'upi',       label: 'UPI ID',         icon: 'fa-mobile',     placeholder: 'yourname@upi'      },
                ].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}><i className={`fa ${f.icon} mr-1 text-[#e84545]`} /> {f.label}</label>
                    <input className={inputCls} value={bank[f.key as keyof typeof bank]}
                      onChange={e => setBank(b => ({ ...b, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => { setBankSaved(true); setTimeout(() => setBankSaved(false), 2500); }}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm">
                    <i className="fa fa-save" /> Save Bank Details
                  </button>
                  {bankSaved && <span className="flex items-center gap-1.5 text-green-600 text-sm"><i className="fa fa-check-circle" /> Saved!</span>}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><i className="fa fa-money text-[#10b981]" /> Wallet & Earnings</h4>
                {[
                  { label: 'Total Earnings',    val: `₹${(user?.totalEarningAmount||12500).toLocaleString()}`, color: '#10b981', icon: 'fa-money'      },
                  { label: 'Wallet Balance',    val: `₹${(user?.walletAmount||0).toLocaleString()}`,           color: '#4f9ef8', icon: 'fa-credit-card' },
                  { label: 'On Hold',           val: `₹${(user?.holdAmount||0).toLocaleString()}`,             color: '#f59e0b', icon: 'fa-clock-o'     },
                  { label: 'Jobs Completed',    val: user?.totalCompletedJobs || 8,                            color: '#e84545', icon: 'fa-check'       },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + '15' }}>
                      <i className={`fa ${s.icon} text-sm`} style={{ color: s.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{s.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-yellow-800 flex items-center gap-1.5 mb-1"><i className="fa fa-info-circle" /> Note</p>
                <p className="text-xs text-yellow-700">Bank details are encrypted and used only for payouts. Changes take 24-48 hours to verify.</p>
              </div>
            </div>
          </div>
        )}


      </div>
    </DashboardLayout>
  );
}
