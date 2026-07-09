'use client';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import DashboardLayout from '@/components/layout/DashboardLayout';

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

export default function AdminProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const initials = (user?.fullName || 'AU').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const [form, setForm] = useState({
    fullName: user?.fullName || 'Admin User',
    email: user?.email || 'admin@matchcreatorz.com',
    phone: user?.phone || '1234567890',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  return (
    <DashboardLayout role="ADMIN" title="My Profile">
      <div className="space-y-5">

        {/* ── Top Banner Card ── */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm overflow-hidden">
          {/* Red banner */}
          <div className="h-32 w-full relative" style={{ background: 'linear-gradient(135deg,#e84545 0%,#c02a2a 100%)' }}>
            {/* Avatar sits at bottom of banner, half outside */}
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
          {/* Info row — sits below banner, avatar's top half overlaps up */}
          <div className="pt-12 pb-5 px-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{form.fullName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{form.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#e84545] border border-red-200">
                <i className="fa fa-shield" /> Super Admin
              </span>
            </div>
            <div className="flex items-center gap-6 text-center">
              {[
                { label: 'Account ID',   val: `#ADM-${user?.id || '001'}` },
                { label: 'Member Since', val: 'Jan 2024' },
                { label: 'Status',       val: 'Active'   },
              ].map(s => (
                <div key={s.label} className="border-l border-gray-100 pl-6 first:border-0 first:pl-0">
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Account Stats */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <i className="fa fa-id-card text-[#e84545]" /> Account Info
              </h3>
              <div className="space-y-3">
                {[
                  { icon: 'fa-id-badge',    color: '#e84545', label: 'Account ID',    val: `#ADM-${user?.id || '001'}` },
                  { icon: 'fa-calendar',    color: '#4f9ef8', label: 'Joined',        val: 'Jan 1, 2024'               },
                  { icon: 'fa-envelope-o',  color: '#10b981', label: 'Email',         val: 'Verified'                  },
                  { icon: 'fa-mobile',      color: '#f59e0b', label: 'Phone',         val: 'Verified'                  },
                  { icon: 'fa-lock',        color: '#8b5cf6', label: 'Last Login',    val: 'Today'                     },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: r.color + '15' }}>
                      <i className={`fa ${r.icon} text-xs`} style={{ color: r.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{r.label}</p>
                      <p className="text-xs font-semibold text-gray-800 truncate">{r.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <i className="fa fa-bar-chart text-[#e84545]" /> Platform Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: 'fa-users',     color: '#4f9ef8', label: 'Total Users',   val: '2,847' },
                  { icon: 'fa-dollar',    color: '#10b981', label: 'Revenue',       val: '$48.2K' },
                  { icon: 'fa-calendar',  color: '#e84545', label: 'Bookings',      val: '1,204'  },
                  { icon: 'fa-life-ring', color: '#f59e0b', label: 'Tickets',       val: '14'     },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="h-8 w-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: s.color + '15' }}>
                      <i className={`fa ${s.icon} text-xs`} style={{ color: s.color }} />
                    </div>
                    <p className="text-sm font-bold text-gray-800">{s.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Info */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                <i className="fa fa-user text-[#e84545]" /> Personal Information
              </h3>
              <p className="text-xs text-gray-400 mb-5">Update your name, email and phone number</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}><i className="fa fa-user mr-1 text-[#e84545]" /> Full Name</label>
                  <input className={inputCls} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}><i className="fa fa-envelope mr-1 text-[#4f9ef8]" /> Email Address</label>
                  <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}><i className="fa fa-phone mr-1 text-[#10b981]" /> Phone Number</label>
                  <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm"
                >
                  <i className="fa fa-save" /> Save Changes
                </button>
                {saved && <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium"><i className="fa fa-check-circle" /> Saved successfully!</span>}
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                <i className="fa fa-lock text-[#e84545]" /> Change Password
              </h3>
              <p className="text-xs text-gray-400 mb-5">Update your admin account password</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'current', label: 'Current Password', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                  { key: 'newPass', label: 'New Password',     show: showNew,     toggle: () => setShowNew(v => !v)     },
                  { key: 'confirm', label: 'Confirm Password', show: showConfirm,  toggle: () => setShowConfirm(v => !v) },
                ].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <div className="relative">
                      <input
                        className={inputCls + ' pr-10'}
                        type={f.show ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwords[f.key as keyof typeof passwords]}
                        onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                      <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className={`fa ${f.show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setPwSaved(true); setPasswords({ current: '', newPass: '', confirm: '' }); setTimeout(() => setPwSaved(false), 2500); }}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm"
                >
                  <i className="fa fa-key" /> Update Password
                </button>
                {pwSaved && <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium"><i className="fa fa-check-circle" /> Password updated!</span>}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                <i className="fa fa-desktop text-[#e84545]" /> Active Sessions
              </h3>
              <p className="text-xs text-gray-400 mb-5">Devices currently logged in to your account</p>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows', location: 'New Delhi, India', time: 'Active now',    icon: 'fa-chrome',  current: true  },
                  { device: 'Safari on iPhone',  location: 'Mumbai, India',    time: '2 hours ago',  icon: 'fa-mobile',  current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#e8e8e8] shadow-sm flex items-center justify-center flex-shrink-0">
                      <i className={`fa ${s.icon} text-gray-500 text-lg`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{s.device}</p>
                      <p className="text-xs text-gray-400 mt-0.5"><i className="fa fa-map-marker mr-1" />{s.location} · {s.time}</p>
                    </div>
                    {s.current
                      ? <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Current</span>
                      : <button className="text-xs text-[#e84545] hover:underline font-medium">Revoke</button>
                    }
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
