'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { profileApi } from '@/lib/adminApi';

type Tab = 'profile' | 'security';
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'profile',  label: 'Profile',  icon: 'fa-user'   },
  { key: 'security', label: 'Security', icon: 'fa-shield' },
];

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

export default function SellerAccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', bio: '', location: '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const [profSaving, setProfSaving] = useState(false);
  const [profMsg,    setProfMsg]    = useState<{ ok: boolean; text: string } | null>(null);
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwMsg,      setPwMsg]      = useState<{ ok: boolean; text: string } | null>(null);
  const [pwErrors,   setPwErrors]   = useState<Record<string, string>>({});

  // Load profile on mount
  useEffect(() => {
    profileApi.get('seller')
      .then((r) => {
        const u = r.data;
        setUserId(u.id);
        setForm({
          name:     u.name     || '',
          email:    u.email    || '',
          phone:    u.phone    || '',
          bio:      u.bio      || '',
          location: u.location || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const initials = form.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S';

  const saveProfile = async () => {
    setProfSaving(true);
    setProfMsg(null);
    try {
      await profileApi.update('seller', {
        user_id:  userId,
        name:     form.name,
        phone:    form.phone,
        bio:      form.bio,
        location: form.location,
      });
      setProfMsg({ ok: true, text: 'Profile saved!' });
    } catch (e: unknown) {
      setProfMsg({ ok: false, text: (e as Error).message || 'Failed to save' });
    } finally {
      setProfSaving(false);
      setTimeout(() => setProfMsg(null), 3000);
    }
  };

  const savePassword = async () => {
    const errs: Record<string, string> = {};
    if (!passwords.current) errs.current = 'Current password is required';
    if (!passwords.newPass) errs.newPass = 'New password is required';
    else if (passwords.newPass.length < 8) errs.newPass = 'Min 8 characters required';
    else if (!/[A-Z]/.test(passwords.newPass)) errs.newPass = 'Must include at least one uppercase letter';
    else if (!/[0-9]/.test(passwords.newPass)) errs.newPass = 'Must include at least one number';
    else if (!/[^A-Za-z0-9]/.test(passwords.newPass)) errs.newPass = 'Must include at least one symbol';
    if (!passwords.confirm) errs.confirm = 'Please confirm your password';
    else if (passwords.newPass && passwords.newPass !== passwords.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwSaving(true);
    setPwMsg(null);
    try {
      await profileApi.changePassword('seller', {
        user_id:          userId,
        current_password: passwords.current,
        new_password:     passwords.newPass,
      });
      setPwMsg({ ok: true, text: 'Password updated!' });
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (e: unknown) {
      setPwMsg({ ok: false, text: (e as Error).message || 'Failed to update' });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 3000);
    }
  };

  return (
    <DashboardLayout role="SELLER" title="My Account">
      <div className="space-y-5">

        {/* Banner Card */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden">
          <div className="relative h-32 w-full" style={{ background: 'linear-gradient(135deg,#e84545 0%,#c02a2a 100%)' }}>
            <div className="absolute -bottom-10 left-8 h-20 w-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center bg-[#e84545]">
              <span className="text-white text-2xl font-bold">{loading ? '...' : initials}</span>
            </div>
          </div>
          <div className="px-8 pb-5 pt-14">
            <h2 className="text-xl font-bold text-gray-900">{form.name || '--'}</h2>
            <p className="text-sm text-gray-500">{form.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#4f9ef8] border border-blue-200">
              <i className="fa fa-briefcase" /> Seller
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8e8e8] shadow-sm p-1 rounded-2xl w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === t.key ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              )}>
              <i className={`fa ${t.icon}`} />{t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa fa-user text-[#e84545]" /> Personal Information
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-400"><i className="fa fa-spinner fa-spin text-2xl" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full Name</label>
                  <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input className={inputCls + ' bg-gray-50 cursor-not-allowed'} type="email" value={form.email} readOnly title="Email cannot be changed" />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Bio</label>
                  <textarea className={inputCls + ' resize-none py-3'} rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell buyers about yourself..." />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button onClick={saveProfile} disabled={profSaving}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60">
                    {profSaving ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> Save Profile</>}
                  </button>
                  {profMsg && (
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${profMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                      <i className={`fa ${profMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {profMsg.text}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <i className="fa fa-lock text-[#e84545]" /> Change Password
            </h3>
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
                    <input
                      className={inputCls + ' pr-10' + (pwErrors[f.key] ? ' border-red-400 focus:border-red-400 focus:ring-red-400' : '')}
                      type={f.show ? 'text' : 'password'} placeholder={f.label}
                      value={passwords[f.key as keyof typeof passwords]}
                      onChange={e => { setPasswords(p => ({ ...p, [f.key]: e.target.value })); setPwErrors(p => { const n = {...p}; delete n[f.key]; return n; }); }} />
                    <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <i className={`fa ${f.show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  {pwErrors[f.key] && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <i className="fa fa-times-circle" /> {pwErrors[f.key]}
                    </p>
                  )}
                </div>
              ))}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                <i className="fa fa-info-circle mr-1.5" />Use at least 8 characters including uppercase, numbers, and symbols.
              </div>
              {pwMsg && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${pwMsg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <i className={`fa ${pwMsg.ok ? 'fa-check-circle' : 'fa-times-circle'}`} /> {pwMsg.text}
                </div>
              )}
              <div className="pt-1">
                <button onClick={savePassword} disabled={pwSaving}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60">
                  {pwSaving ? <><i className="fa fa-spinner fa-spin" /> Updating...</> : <><i className="fa fa-shield" /> Update Password</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
