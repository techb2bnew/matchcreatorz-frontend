'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';

type Tab = 'platform' | 'plans' | 'appinfo';

const tabs: { key: Tab; label: string; icon: string; desc: string }[] = [
  { key: 'platform', label: 'Platform Fees',  icon: 'fa-percent',     desc: 'Commission & settlement'   },
  { key: 'plans',    label: 'Connect Plans',  icon: 'fa-link',        desc: 'Seller bid packages'       },
  { key: 'appinfo',  label: 'App Info',       icon: 'fa-info-circle', desc: 'App config & stats'        },
];

const inputCls = 'w-full bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-4 h-11 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:border-[#e84545] focus:ring-2 focus:ring-[#e84545]/10 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('platform');

  const [platformFee, setPlatformFee] = useState('10');
  const [minSettle, setMinSettle]     = useState('2');
  const [taxRate, setTaxRate]         = useState('18');
  const [feeSaved, setFeeSaved]       = useState(false);

  const [plans, setPlans] = useState([
    { id: 1, name: 'Starter',  price: '9.99',  connects: '30',  color: '#e84545', icon: 'fa-leaf'    },
    { id: 2, name: 'Pro',      price: '19.99', connects: '80',  color: '#4f9ef8', icon: 'fa-bolt'    },
    { id: 3, name: 'Business', price: '39.99', connects: '200', color: '#10b981', icon: 'fa-building' },
  ]);
  const [planSaved, setPlanSaved] = useState(false);
  const updatePlan = (id: number, field: 'price' | 'connects', value: string) =>
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const [appName, setAppName]           = useState('MatchCreatorz');
  const [supportEmail, setSupportEmail] = useState('support@matchcreatorz.com');
  const [supportPhone, setSupportPhone] = useState('+91 800 123 4567');
  const [appVersion, setAppVersion]     = useState('1.0.0');
  const [timezone, setTimezone]         = useState('Asia/Kolkata');
  const [currency, setCurrency]         = useState('INR');
  const [appSaved, setAppSaved]         = useState(false);

  return (
    <DashboardLayout role="ADMIN" title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* ── Left: Tab sidebar ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-2 space-y-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                  activeTab === t.key
                    ? 'bg-[#e84545] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <i className={`fa ${t.icon} text-base flex-shrink-0`} />
                <div>
                  <p className="text-sm font-semibold leading-none">{t.label}</p>
                  <p className={cn('text-xs mt-0.5', activeTab === t.key ? 'text-red-100' : 'text-gray-400')}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5 mt-5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Platform Stats</h4>
            <div className="space-y-3">
              {[
                { label: 'Total Users',   val: '2,847', color: '#4f9ef8', icon: 'fa-users'     },
                { label: 'Active Today',  val: '412',   color: '#10b981', icon: 'fa-circle'    },
                { label: 'Revenue',       val: '$48.2K',color: '#e84545', icon: 'fa-dollar'    },
                { label: 'Open Tickets',  val: '14',    color: '#f59e0b', icon: 'fa-life-ring' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + '15' }}>
                    <i className={`fa ${s.icon} text-xs`} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-bold text-gray-800">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Content ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Platform Fees */}
          {activeTab === 'platform' && (
            <>
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <i className="fa fa-percent text-[#e84545]" /> Commission Settings
                </h3>
                <p className="text-xs text-gray-400 mb-6">Configure the commission and settlement thresholds</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                  <div>
                    <label className={labelCls}><i className="fa fa-percent mr-1 text-[#e84545]" /> Platform Fee (%)</label>
                    <input className={inputCls} type="number" value={platformFee} onChange={e => setPlatformFee(e.target.value)} placeholder="10" />
                    <p className="text-xs text-gray-400 mt-1.5">Commission per booking</p>
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-balance-scale mr-1 text-[#4f9ef8]" /> Min. Settlement (%)</label>
                    <input className={inputCls} type="number" value={minSettle} onChange={e => setMinSettle(e.target.value)} placeholder="2" />
                    <p className="text-xs text-gray-400 mt-1.5">Min. share before payout</p>
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-calculator mr-1 text-[#10b981]" /> Tax Rate (%)</label>
                    <input className={inputCls} type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="18" />
                    <p className="text-xs text-gray-400 mt-1.5">GST / tax applied</p>
                  </div>
                </div>

                {/* Fee Preview */}
                <div className="bg-gradient-to-r from-[#fef2f2] to-[#fff5f5] border border-[#e84545]/20 rounded-2xl p-5">
                  <p className="text-xs font-bold text-[#e84545] mb-4 flex items-center gap-2">
                    <i className="fa fa-calculator" /> Live Fee Preview (₹1,000 booking)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Booking Amount', val: '₹1,000',                                                     color: '#1a1a1a', bg: '#f0f0f0' },
                      { label: `Platform (${platformFee}%)`, val: `₹${(1000*Number(platformFee)/100).toFixed(0)}`,  color: '#e84545', bg: '#fde8e8' },
                      { label: `Tax (${taxRate}%)`,          val: `₹${(1000*Number(taxRate)/100).toFixed(0)}`,      color: '#f59e0b', bg: '#fef3c7' },
                      { label: 'Seller Gets',               val: `₹${(1000-1000*Number(platformFee)/100).toFixed(0)}`, color: '#10b981', bg: '#d1fae5' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: item.bg }}>
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className="text-base font-bold" style={{ color: item.color }}>{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button
                    onClick={() => { setFeeSaved(true); setTimeout(() => setFeeSaved(false), 2000); }}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm"
                  >
                    {feeSaved ? <><i className="fa fa-check" /> Saved!</> : <><i className="fa fa-save" /> Save Fees</>}
                  </button>
                  {feeSaved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><i className="fa fa-check-circle" /> Changes saved</span>}
                </div>
              </div>
            </>
          )}

          {/* Connect Plans */}
          {activeTab === 'plans' && (
            <>
              <div className="bg-[#e8f4fd] border border-[#4f9ef8]/30 rounded-2xl p-4 flex items-start gap-3">
                <i className="fa fa-info-circle text-[#4f9ef8] text-lg mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#1e40af]">Connect plans allow sellers to bid on buyer jobs. Set the price and number of connects for each plan tier.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((plan, idx) => (
                  <div key={plan.id} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: plan.color + '15' }}>
                        <i className={`fa ${plan.icon} text-base`} style={{ color: plan.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{plan.name}</p>
                        <p className="text-xs text-gray-400">Plan {idx + 1}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Price (USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                          <input
                            type="number"
                            value={plan.price}
                            onChange={e => updatePlan(plan.id, 'price', e.target.value)}
                            className={inputCls + ' pl-7'}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Connects</label>
                        <input
                          type="number"
                          value={plan.connects}
                          onChange={e => updatePlan(plan.id, 'connects', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="pt-1 rounded-xl p-3 text-center" style={{ background: plan.color + '10' }}>
                        <p className="text-xs text-gray-500">Per Connect Cost</p>
                        <p className="text-base font-bold mt-0.5" style={{ color: plan.color }}>
                          ${plan.price && plan.connects ? (Number(plan.price) / Number(plan.connects)).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Save all plan changes</p>
                  <p className="text-xs text-gray-400 mt-0.5">Updates will apply to new purchases immediately</p>
                </div>
                <div className="flex items-center gap-3">
                  {planSaved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><i className="fa fa-check-circle" /> Saved!</span>}
                  <button
                    onClick={() => { setPlanSaved(true); setTimeout(() => setPlanSaved(false), 2000); }}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm"
                  >
                    <i className="fa fa-save" /> Save Plans
                  </button>
                </div>
              </div>
            </>
          )}

          {/* App Info */}
          {activeTab === 'appinfo' && (
            <>
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <i className="fa fa-globe text-[#e84545]" /> Application Settings
                </h3>
                <p className="text-xs text-gray-400 mb-6">General app configuration and contact details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}><i className="fa fa-globe mr-1 text-[#e84545]" /> App Name</label>
                    <input className={inputCls} value={appName} onChange={e => setAppName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-code-fork mr-1 text-[#4f9ef8]" /> App Version</label>
                    <input className={inputCls} value={appVersion} onChange={e => setAppVersion(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-envelope mr-1 text-[#10b981]" /> Support Email</label>
                    <input className={inputCls} type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-phone mr-1 text-[#f59e0b]" /> Support Phone</label>
                    <input className={inputCls} value={supportPhone} onChange={e => setSupportPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-clock-o mr-1 text-[#8b5cf6]" /> Timezone</label>
                    <select className={inputCls} value={timezone} onChange={e => setTimezone(e.target.value)}>
                      <option>Asia/Kolkata</option>
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-money mr-1 text-[#10b981]" /> Currency</label>
                    <select className={inputCls} value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option>INR</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button
                    onClick={() => { setAppSaved(true); setTimeout(() => setAppSaved(false), 2000); }}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm"
                  >
                    {appSaved ? <><i className="fa fa-check" /> Saved!</> : <><i className="fa fa-save" /> Save App Info</>}
                  </button>
                  {appSaved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><i className="fa fa-check-circle" /> Settings saved</span>}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fa fa-heartbeat text-[#e84545]" /> System Health
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'API Status',   val: 'Online',  color: '#10b981', icon: 'fa-check-circle',  bg: '#d1fae5' },
                    { label: 'DB Status',    val: 'Healthy', color: '#10b981', icon: 'fa-database',      bg: '#d1fae5' },
                    { label: 'Uptime',       val: '99.9%',   color: '#4f9ef8', icon: 'fa-clock-o',       bg: '#dbeafe' },
                    { label: 'Last Backup',  val: '2h ago',  color: '#f59e0b', icon: 'fa-hdd-o',         bg: '#fef3c7' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
                      <i className={`fa ${s.icon} text-xl mb-2`} style={{ color: s.color }} />
                      <p className="text-sm font-bold" style={{ color: s.color }}>{s.val}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
