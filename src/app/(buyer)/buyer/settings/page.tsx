'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { preferencesApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

type Tab = 'notifications' | 'privacy' | 'wallet' | 'support';
const tabs: { key: Tab; label: string; icon: string; desc: string }[] = [
  { key: 'notifications', label: 'Notifications', icon: 'fa-bell',        desc: 'Alert preferences'  },
  { key: 'privacy',       label: 'Privacy',        icon: 'fa-eye-slash',   desc: 'Visibility & data'  },
  { key: 'wallet',        label: 'Wallet',         icon: 'fa-credit-card', desc: 'Payment settings'   },
  { key: 'support',       label: 'Support',        icon: 'fa-life-ring',   desc: 'Help & feedback'    },
];

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', on ? 'bg-[#e84545]' : 'bg-gray-200')}>
      <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}

export default function BuyerSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  // Notifications
  const [emailNotif, setEmailNotif]     = useState(true);
  const [smsNotif, setSmsNotif]         = useState(true);
  const [offerAlert, setOfferAlert]     = useState(true);
  const [bookingAlert, setBookingAlert] = useState(true);
  const [payAlert, setPayAlert]         = useState(false);
  const [chatAlert, setChatAlert]       = useState(true);

  // Privacy
  const [showProfile, setShowProfile]   = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [allowMsg, setAllowMsg]         = useState(false);

  // Wallet
  const [autoReload, setAutoReload]     = useState(false);
  const [reloadAmount, setReloadAmount] = useState('1000');
  const [walletSaved, setWalletSaved]   = useState(false);

  // ── Load persisted preferences ──────────────────────────────
  const hydrating = useRef(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await preferencesApi.get('buyer');
        const p = res.data || {};
        const n = p.notifications || {}, pr = p.privacy || {}, w = p.wallet || {};
        if (n.email       !== undefined) setEmailNotif(!!n.email);
        if (n.sms         !== undefined) setSmsNotif(!!n.sms);
        if (n.offerAlert  !== undefined) setOfferAlert(!!n.offerAlert);
        if (n.bookingAlert!== undefined) setBookingAlert(!!n.bookingAlert);
        if (n.payAlert    !== undefined) setPayAlert(!!n.payAlert);
        if (n.chatAlert   !== undefined) setChatAlert(!!n.chatAlert);
        if (pr.showProfile  !== undefined) setShowProfile(!!pr.showProfile);
        if (pr.showActivity !== undefined) setShowActivity(!!pr.showActivity);
        if (pr.allowMsg     !== undefined) setAllowMsg(!!pr.allowMsg);
        if (w.autoReload    !== undefined) setAutoReload(!!w.autoReload);
        if (w.reloadAmount  !== undefined) setReloadAmount(String(w.reloadAmount));
      } catch { /* keep defaults */ }
      finally { setTimeout(() => { hydrating.current = false; }, 0); }
    })();
  }, []);

  // ── Auto-save notification + privacy toggles (debounced) ────
  useEffect(() => {
    if (hydrating.current) return;
    const t = setTimeout(() => {
      preferencesApi.update('buyer', {
        notifications: { email: emailNotif, sms: smsNotif, offerAlert, bookingAlert, payAlert, chatAlert },
        privacy:       { showProfile, showActivity, allowMsg },
      }).then(() => toast.success('Preferences saved', { id: 'prefs' }))
        .catch(() => toast.error('Failed to save preferences', { id: 'prefs' }));
    }, 500);
    return () => clearTimeout(t);
  }, [emailNotif, smsNotif, offerAlert, bookingAlert, payAlert, chatAlert, showProfile, showActivity, allowMsg]);

  const saveWallet = async () => {
    try {
      await preferencesApi.update('buyer', { wallet: { autoReload, reloadAmount: Number(reloadAmount) || 0 } });
      setWalletSaved(true); setTimeout(() => setWalletSaved(false), 2000);
      toast.success('Wallet settings saved');
    } catch { toast.error('Failed to save wallet settings'); }
  };

  const notifItems = [
    { label: 'Email Notifications', desc: 'Receive updates via email',              val: emailNotif,  set: setEmailNotif  },
    { label: 'SMS Notifications',   desc: 'Receive alerts on your phone',           val: smsNotif,    set: setSmsNotif    },
    { label: 'New Offers',          desc: 'When sellers send you an offer',         val: offerAlert,  set: setOfferAlert  },
    { label: 'Booking Updates',     desc: 'Updates on your bookings',               val: bookingAlert,set: setBookingAlert},
    { label: 'Payment Alerts',      desc: 'Alerts for wallet transactions',         val: payAlert,    set: setPayAlert    },
    { label: 'Chat Messages',       desc: 'New messages from sellers',              val: chatAlert,   set: setChatAlert   },
  ];

  const privacyItems = [
    { label: 'Profile Visibility',    desc: 'Show your profile to sellers',          val: showProfile,  set: setShowProfile  },
    { label: 'Show Activity Status',  desc: 'Let sellers see when you are online',   val: showActivity, set: setShowActivity },
    { label: 'Allow Direct Messages', desc: 'Allow sellers to message you directly', val: allowMsg,     set: setAllowMsg     },
  ];

  return (
    <DashboardLayout role="BUYER" title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-2 space-y-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                  activeTab === t.key ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                )}>
                <i className={`fa ${t.icon} text-base flex-shrink-0`} />
                <div>
                  <p className="text-sm font-semibold leading-none">{t.label}</p>
                  <p className={cn('text-xs mt-0.5', activeTab === t.key ? 'text-red-100' : 'text-gray-400')}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#e84545] mb-2 flex items-center gap-1.5"><i className="fa fa-trash" /> Danger Zone</p>
            <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all data.</p>
            <button className="w-full border border-red-300 text-[#e84545] rounded-xl py-2 text-xs font-semibold hover:bg-red-100 transition">
              Delete Account
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="lg:col-span-3 space-y-5">

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-bell text-[#e84545]" /> Notification Preferences</h3>
              <p className="text-xs text-gray-400 mb-6">Control which alerts you receive</p>
              <div className="divide-y divide-gray-50">
                {notifItems.map(n => (
                  <div key={n.label} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                    <Toggle on={n.val} onChange={() => n.set(v => !v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy */}
          {activeTab === 'privacy' && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-eye-slash text-[#e84545]" /> Privacy & Security</h3>
              <p className="text-xs text-gray-400 mb-6">Control your visibility and account security</p>
              <div className="divide-y divide-gray-50">
                {privacyItems.map(n => (
                  <div key={n.label} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                    <Toggle on={n.val} onChange={() => n.set(v => !v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Settings */}
          {activeTab === 'wallet' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-credit-card text-[#e84545]" /> Wallet Settings</h3>
                <p className="text-xs text-gray-400 mb-5">Configure your wallet preferences</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Auto-Reload Amount ($)</label>
                    <input className={inputCls} type="number" value={reloadAmount} onChange={e => setReloadAmount(e.target.value)} placeholder="1000" />
                    <p className="text-xs text-gray-400 mt-1">Reload when balance drops below $200</p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Auto Reload</p>
                      <p className="text-xs text-gray-400 mt-0.5">Automatically add money when low</p>
                    </div>
                    <Toggle on={autoReload} onChange={() => setAutoReload(v => !v)} />
                  </div>
                  <button onClick={saveWallet}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm w-full justify-center">
                    {walletSaved ? <><i className="fa fa-check" /> Saved!</> : <><i className="fa fa-save" /> Save Settings</>}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i className="fa fa-clock-o text-[#4f9ef8]" /> Recent Transactions</h4>
                  {[
                    { label: 'Added via UPI',      amount: '+$2,000', date: 'Jun 29', color: '#10b981' },
                    { label: 'Booking Payment',    amount: '-$800',   date: 'Jun 25', color: '#e84545' },
                    { label: 'Refund received',    amount: '+$500',   date: 'Jun 20', color: '#10b981' },
                    { label: 'Booking Payment',    amount: '-$1,200', date: 'Jun 15', color: '#e84545' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: t.color }}>{t.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1"><i className="fa fa-info-circle" /> Wallet Info</p>
                  <p className="text-xs text-blue-600">Wallet funds can be used for bookings. Unused balance can be refunded within 30 days.</p>
                </div>
              </div>
            </div>
          )}

          {/* Support */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-life-ring text-[#e84545]" /> Help & Support</h3>
                <p className="text-xs text-gray-400 mb-5">Get help or send us a message</p>
                <div className="space-y-3">
                  {[
                    { icon: 'fa-question-circle', color: '#4f9ef8', label: 'Help Center',     desc: 'Browse FAQs and guides'    },
                    { icon: 'fa-comments',         color: '#10b981', label: 'Live Chat',       desc: 'Chat with support team'    },
                    { icon: 'fa-envelope',         color: '#f59e0b', label: 'Email Support',   desc: 'support@matchcreatorz.com' },
                    { icon: 'fa-flag',             color: '#e84545', label: 'Report an Issue', desc: 'Report bugs or problems'   },
                  ].map(item => (
                    <button key={item.label} className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#e8e8e8] shadow-sm hover:border-[#e84545] hover:bg-red-50 transition text-left">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15' }}>
                        <i className={`fa ${item.icon} text-base`} style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <i className="fa fa-chevron-right text-gray-300 text-xs ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-comment text-[#e84545]" /> Send Feedback</h3>
                <p className="text-xs text-gray-400 mb-5">Help us improve MatchCreatorz</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Subject</label>
                    <input className={inputCls} placeholder="e.g. Feature request" />
                  </div>
                  <div>
                    <label className={labelCls}>Message</label>
                    <textarea className="w-full border border-[#e8e8e8] shadow-sm rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition h-32 resize-none" placeholder="Tell us what you think..." />
                  </div>
                  <button className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm w-full justify-center">
                    <i className="fa fa-paper-plane" /> Send Feedback
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
