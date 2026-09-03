'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn, formatCurrency } from '@/lib/utils';
import { adminSettingApi, adminStatsApi, systemApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

type Tab = 'platform' | 'plans' | 'escrow' | 'appinfo';

const tabs: { key: Tab; label: string; icon: string; desc: string }[] = [
  { key: 'platform', label: 'Platform Fees',  icon: 'fa-percent',     desc: 'Commission & settlement'   },
  { key: 'plans',    label: 'Connect Plans',  icon: 'fa-link',        desc: 'Seller bid packages'       },
  { key: 'escrow',   label: 'Delayed transfer',         icon: 'fa-shield',      desc: 'Stripe payment protection' },
  // { key: 'appinfo',  label: 'App Info',       icon: 'fa-info-circle', desc: 'App config & stats'        },
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
  const [connectsPerBid, setConnectsPerBid] = useState('1');
  const [planSaved, setPlanSaved] = useState(false);
  const updatePlan = (id: number, field: 'price' | 'connects', value: string) =>
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const [escrowEnabled, setEscrowEnabled] = useState(false);
  const [savingEscrow, setSavingEscrow]   = useState(false);
  const [escrowSaved, setEscrowSaved]     = useState(false);

  const [appName, setAppName]           = useState('MatchCreatorz');
  const [supportEmail, setSupportEmail] = useState('support@matchcreatorz.com');
  const [supportPhone, setSupportPhone] = useState('+91 800 123 4567');
  const [appVersion, setAppVersion]     = useState('1.0.0');
  const [timezone, setTimezone]         = useState('Asia/Kolkata');
  const [currency, setCurrency]         = useState('INR');
  const [appSaved, setAppSaved]         = useState(false);

  const [savingFees, setSavingFees]   = useState(false);
  const [savingPlans, setSavingPlans] = useState(false);
  const [savingApp, setSavingApp]     = useState(false);

  interface PlatformStats { totalUsers: number; newUsersToday: number; totalRevenue: number; openTickets: number }
  interface SystemHealth { db: string; env: string; uptime_secs: number }
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [systemHealth, setSystemHealth]   = useState<SystemHealth | null>(null);

  useEffect(() => {
    adminStatsApi.get().then(r => setPlatformStats(r.data?.stats || null)).catch(() => {});
    systemApi.health().then(r => setSystemHealth(r)).catch(() => {});
  }, []);

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await adminSettingApi.get();
        const d = res.data || {};
        if (d.platform_fees) {
          if (d.platform_fees.platform_fee   != null) setPlatformFee(String(d.platform_fees.platform_fee));
          if (d.platform_fees.min_settlement != null) setMinSettle(String(d.platform_fees.min_settlement));
          if (d.platform_fees.tax_rate       != null) setTaxRate(String(d.platform_fees.tax_rate));
        }
        if (d.bid_settings?.connects_per_bid != null) setConnectsPerBid(String(d.bid_settings.connects_per_bid));
        if (Array.isArray(d.connect_plans) && d.connect_plans.length) {
          setPlans(d.connect_plans.map((p: { id: number; name: string; price: number | string; connects: number | string; color?: string; icon?: string }, i: number) => ({
            id: p.id ?? i + 1,
            name: p.name,
            price: String(p.price),
            connects: String(p.connects),
            color: p.color || ['#e84545', '#4f9ef8', '#10b981'][i % 3],
            icon: p.icon || 'fa-link',
          })));
        }
        if (d.escrow_settings) {
          setEscrowEnabled(!!d.escrow_settings.enabled);
        }
        if (d.app_info) {
          if (d.app_info.app_name)      setAppName(d.app_info.app_name);
          if (d.app_info.support_email) setSupportEmail(d.app_info.support_email);
          if (d.app_info.support_phone) setSupportPhone(d.app_info.support_phone);
          if (d.app_info.app_version)   setAppVersion(d.app_info.app_version);
          if (d.app_info.timezone)      setTimezone(d.app_info.timezone);
          if (d.app_info.currency)      setCurrency(d.app_info.currency);
        }
      } catch {
        /* keep defaults if load fails */
      }
    })();
  }, []);

  const saveFees = async () => {
    setSavingFees(true);
    try {
      await adminSettingApi.update({
        platform_fees: {
          platform_fee:   Number(platformFee) || 0,
          min_settlement: Number(minSettle)   || 0,
          tax_rate:       Number(taxRate)     || 0,
        },
      });
      toast.success('Platform fees saved');
      setFeeSaved(true); setTimeout(() => setFeeSaved(false), 2000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save fees');
    } finally { setSavingFees(false); }
  };

  const savePlans = async () => {
    setSavingPlans(true);
    try {
      await adminSettingApi.update({
        connect_plans: plans.map((p) => ({
          id: p.id, name: p.name, price: Number(p.price) || 0,
          connects: Number(p.connects) || 0, color: p.color, icon: p.icon,
        })),
        bid_settings: { connects_per_bid: Number(connectsPerBid) || 1 },
      });
      toast.success('Connect plans saved');
      setPlanSaved(true); setTimeout(() => setPlanSaved(false), 2000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save plans');
    } finally { setSavingPlans(false); }
  };

  const saveEscrow = async (next: boolean) => {
    setSavingEscrow(true);
    try {
      await adminSettingApi.update({ escrow_settings: { enabled: next } });
      setEscrowEnabled(next);
      toast.success(next ? 'Escrow enabled' : 'Escrow disabled');
      setEscrowSaved(true); setTimeout(() => setEscrowSaved(false), 2000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update escrow setting');
    } finally { setSavingEscrow(false); }
  };

  const saveApp = async () => {
    setSavingApp(true);
    try {
      await adminSettingApi.update({
        app_info: {
          app_name: appName, support_email: supportEmail, support_phone: supportPhone,
          app_version: appVersion, timezone, currency,
        },
      });
      toast.success('App info saved');
      setAppSaved(true); setTimeout(() => setAppSaved(false), 2000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save app info');
    } finally { setSavingApp(false); }
  };

  return (
    <DashboardLayout role="ADMIN" title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* -- Left: Tab sidebar -- */}
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
                { label: 'Total Users',      val: platformStats ? platformStats.totalUsers.toLocaleString() : '…', color: '#4f9ef8', icon: 'fa-users'     },
                { label: 'New Today',        val: platformStats ? String(platformStats.newUsersToday) : '…',        color: '#10b981', icon: 'fa-circle'    },
                { label: 'Revenue',          val: platformStats ? formatCurrency(platformStats.totalRevenue) : '…', color: '#e84545', icon: 'fa-dollar'    },
                { label: 'Open Tickets',     val: platformStats ? String(platformStats.openTickets) : '…',          color: '#f59e0b', icon: 'fa-life-ring' },
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

        {/* -- Right: Content -- */}
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
                    <i className="fa fa-calculator" /> Live Fee Preview ($1,000 booking)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Booking Amount', val: '$1,000',                                                     color: '#1a1a1a', bg: '#f0f0f0' },
                      { label: `Platform (${platformFee}%)`, val: `$${(1000*Number(platformFee)/100).toFixed(0)}`,  color: '#e84545', bg: '#fde8e8' },
                      { label: `Tax (${taxRate}%)`,          val: `$${(1000*Number(taxRate)/100).toFixed(0)}`,      color: '#f59e0b', bg: '#fef3c7' },
                      { label: 'Seller Gets',               val: `$${(1000-1000*Number(platformFee)/100).toFixed(0)}`, color: '#10b981', bg: '#d1fae5' },
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
                    onClick={saveFees}
                    disabled={savingFees}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60"
                  >
                    {savingFees ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : feeSaved ? <><i className="fa fa-check" /> Saved!</> : <><i className="fa fa-save" /> Save Fees</>}
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

              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <i className="fa fa-gavel text-[#e84545]" /> Bidding Cost
                </h3>
                <p className="text-xs text-gray-400 mb-4">How many connects a seller spends each time they place a bid on a job</p>
                <div className="max-w-xs">
                  <label className={labelCls}><i className="fa fa-link mr-1 text-[#e84545]" /> Connects Deducted per Bid</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={connectsPerBid}
                    onChange={e => setConnectsPerBid(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Refunded automatically if the seller withdraws the bid</p>
                </div>
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
                    onClick={savePlans}
                    disabled={savingPlans}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60"
                  >
                    {savingPlans ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : <><i className="fa fa-save" /> Save Plans</>}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Escrow */}
          {activeTab === 'escrow' && (
            <>
              <div className="bg-[#e8f4fd] border border-[#4f9ef8]/30 rounded-2xl p-4 flex items-start gap-3">
                <i className="fa fa-info-circle text-[#4f9ef8] text-lg mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#1e40af]">
                  When enabled, fixed-price and milestone bookings are paid via a real Stripe hold/charge instead of
                  the wallet — the buyer&apos;s card is charged directly and funds are released to the seller on
                  acceptance. Hourly bookings always stay on the wallet flow. Uses the existing Stripe keys already
                  configured for the platform — no extra setup needed. Turning this off only affects new bookings;
                  bookings already in escrow are unaffected.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <i className="fa fa-shield text-[#e84545]" /> Delayed Payments
                </h3>
                <p className="text-xs text-gray-400 mb-6">Protect buyers with Stripe-backed delayed transfers on fixed-price and milestone bookings</p>

                <div className="flex items-center justify-between bg-[#f7f7f7] border border-[#e8e8e8] rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0', escrowEnabled ? 'bg-[#10b981]/15' : 'bg-gray-200')}>
                      <i className={cn('fa fa-shield text-lg', escrowEnabled ? 'text-[#10b981]' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{escrowEnabled ? 'Delayed Payments is Enabled' : 'Delayed Payments is Disabled'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {escrowEnabled
                          ? 'New fixed-price and milestone bookings will use Stripe delayed transfers '
                          : 'New bookings continue to use the standard wallet flow'}
                      </p>
                    </div>
                  </div>

                  <button
                    role="switch"
                    aria-checked={escrowEnabled}
                    disabled={savingEscrow}
                    onClick={() => saveEscrow(!escrowEnabled)}
                    className={cn(
                      'relative inline-flex h-7 w-13 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60',
                      escrowEnabled ? 'bg-[#10b981]' : 'bg-gray-300'
                    )}
                    style={{ width: 52 }}
                  >
                    <span
                      className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                        escrowEnabled ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {escrowSaved && (
                  <span className="text-green-600 text-sm font-medium flex items-center gap-1 mt-4">
                    <i className="fa fa-check-circle" /> Setting saved
                  </span>
                )}
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
                    onClick={saveApp}
                    disabled={savingApp}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-60"
                  >
                    {savingApp ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : appSaved ? <><i className="fa fa-check" /> Saved!</> : <><i className="fa fa-save" /> Save App Info</>}
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
                    { label: 'API Status',   val: systemHealth ? 'Online' : 'Checking…', color: '#10b981', icon: 'fa-check-circle',  bg: '#d1fae5' },
                    { label: 'DB Status',    val: systemHealth ? (systemHealth.db === 'healthy' ? 'Healthy' : 'Unreachable') : '…', color: systemHealth?.db === 'healthy' ? '#10b981' : '#ef4444', icon: 'fa-database', bg: systemHealth?.db === 'healthy' ? '#d1fae5' : '#fee2e2' },
                    { label: 'Uptime',       val: systemHealth ? formatUptime(systemHealth.uptime_secs) : '…', color: '#4f9ef8', icon: 'fa-clock-o', bg: '#dbeafe' },
                    { label: 'Environment',  val: systemHealth ? systemHealth.env : '…',  color: '#f59e0b', icon: 'fa-server',        bg: '#fef3c7' },
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
