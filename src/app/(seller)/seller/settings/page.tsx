'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { preferencesApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

type Tab = 'notifications' | 'privacy' | 'payment' | 'support';
const tabs: { key: Tab; label: string; icon: string; desc: string }[] = [
  { key: 'notifications', label: 'Notifications', icon: 'fa-bell',        desc: 'Alert preferences'   },
  { key: 'privacy',       label: 'Privacy',        icon: 'fa-eye-slash',   desc: 'Visibility & data'   },
  { key: 'payment',       label: 'Payouts',        icon: 'fa-money',       desc: 'Withdrawal settings' },
  { key: 'support',       label: 'Support',        icon: 'fa-life-ring',   desc: 'Help & feedback'     },
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

export default function SellerSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  // Notifications
  const [emailNotif, setEmailNotif]     = useState(true);
  const [smsNotif, setSmsNotif]         = useState(false);
  const [jobAlert, setJobAlert]         = useState(true);
  const [bookingAlert, setBookingAlert] = useState(true);
  const [payAlert, setPayAlert]         = useState(true);
  const [chatAlert, setChatAlert]       = useState(false);
  const [offerAlert, setOfferAlert]     = useState(true);

  // Privacy
  const [showProfile, setShowProfile]       = useState(true);
  const [showEarnings, setShowEarnings]     = useState(false);
  const [showRating, setShowRating]         = useState(true);
  const [available, setAvailable]           = useState(true);

  // Payout
  const [minPayout, setMinPayout]   = useState('500');
  const [payMethod, setPayMethod]   = useState('bank');
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [payoutSaved, setPayoutSaved] = useState(false);

  // ── Load persisted preferences ──────────────────────────────
  const hydrating = useRef(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await preferencesApi.get('seller');
        const p = res.data || {};
        const n = p.notifications || {}, pr = p.privacy || {}, po = p.payout || {};
        if (n.email       !== undefined) setEmailNotif(!!n.email);
        if (n.sms         !== undefined) setSmsNotif(!!n.sms);
        if (n.jobAlert    !== undefined) setJobAlert(!!n.jobAlert);
        if (n.bookingAlert!== undefined) setBookingAlert(!!n.bookingAlert);
        if (n.payAlert    !== undefined) setPayAlert(!!n.payAlert);
        if (n.chatAlert   !== undefined) setChatAlert(!!n.chatAlert);
        if (n.offerAlert  !== undefined) setOfferAlert(!!n.offerAlert);
        if (pr.showProfile !== undefined) setShowProfile(!!pr.showProfile);
        if (pr.showEarnings!== undefined) setShowEarnings(!!pr.showEarnings);
        if (pr.showRating  !== undefined) setShowRating(!!pr.showRating);
        if (pr.available   !== undefined) setAvailable(!!pr.available);
        if (po.minPayout   !== undefined) setMinPayout(String(po.minPayout));
        if (po.payMethod   !== undefined) setPayMethod(po.payMethod);
        if (po.autoWithdraw!== undefined) setAutoWithdraw(!!po.autoWithdraw);
      } catch { /* keep defaults */ }
      finally { setTimeout(() => { hydrating.current = false; }, 0); }
    })();
  }, []);

  // ── Auto-save notification + privacy toggles (debounced) ────
  useEffect(() => {
    if (hydrating.current) return;
    const t = setTimeout(() => {
      preferencesApi.update('seller', {
        notifications: { email: emailNotif, sms: smsNotif, jobAlert, bookingAlert, payAlert, chatAlert, offerAlert },
        privacy:       { showProfile, showEarnings, showRating, available },
      }).then(() => toast.success('Preferences saved', { id: 'prefs' }))
        .catch(() => toast.error('Failed to save preferences', { id: 'prefs' }));
    }, 500);
    return () => clearTimeout(t);
  }, [emailNotif, smsNotif, jobAlert, bookingAlert, payAlert, chatAlert, offerAlert, showProfile, showEarnings, showRating, available]);

  const savePayout = async () => {
    try {
      await preferencesApi.update('seller', { payout: { minPayout: Number(minPayout) || 0, payMethod, autoWithdraw } });
      setPayoutSaved(true); setTimeout(() => setPayoutSaved(false), 2000);
      toast.success('Payout settings saved');
    } catch { toast.error('Failed to save payout settings'); }
  };

  const notifItems = [
    { label: 'Email Notifications', desc: 'Receive updates via email',              val: emailNotif,  set: setEmailNotif  },
    { label: 'SMS Notifications',   desc: 'Receive alerts on your phone',           val: smsNotif,    set: setSmsNotif    },
    { label: 'New Job Alerts',      desc: 'Alert when matching jobs are posted',     val: jobAlert,    set: setJobAlert    },
    { label: 'Booking Updates',     desc: 'Updates on your bookings',               val: bookingAlert,set: setBookingAlert},
    { label: 'Payment Alerts',      desc: 'Alerts for payments and payouts',        val: payAlert,    set: setPayAlert    },
    { label: 'Chat Messages',       desc: 'New messages from buyers',               val: chatAlert,   set: setChatAlert   },
    { label: 'New Offers',          desc: 'When buyers send you an offer',          val: offerAlert,  set: setOfferAlert  },
  ];

  const privacyItems = [
    { label: 'Profile Visibility',  desc: 'Show your profile in search results',   val: showProfile,  set: setShowProfile  },
    { label: 'Show Earnings',       desc: 'Display total earnings on your profile', val: showEarnings, set: setShowEarnings },
    { label: 'Show Ratings',        desc: 'Display your rating publicly',           val: showRating,   set: setShowRating   },
    { label: 'Available for Work',  desc: 'Show as available to buyers',            val: available,    set: setAvailable    },
  ];

  return (
    <DashboardLayout role="SELLER" title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left sidebar tabs */}
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

          {/* Payouts */}
          {activeTab === 'payment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-money text-[#e84545]" /> Payout Preferences</h3>
                <p className="text-xs text-gray-400 mb-5">Configure how you receive payments</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Minimum Payout Amount ($)</label>
                    <input className={inputCls} type="number" value={minPayout} onChange={e => setMinPayout(e.target.value)} placeholder="500" />
                    <p className="text-xs text-gray-400 mt-1">Minimum balance before withdrawal</p>
                  </div>
                  <div>
                    <label className={labelCls}>Preferred Payout Method</label>
                    <select className={inputCls} value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                      <option value="bank">Bank Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="wallet">Platform Wallet</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Auto Withdraw</p>
                      <p className="text-xs text-gray-400 mt-0.5">Auto withdraw when threshold is reached</p>
                    </div>
                    <Toggle on={autoWithdraw} onChange={() => setAutoWithdraw(v => !v)} />
                  </div>
                  <button onClick={savePayout}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm w-full justify-center">
                    {payoutSaved ? <><i className="fa fa-check" /> Saved!</> : <><i className="fa fa-save" /> Save Payout Settings</>}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i className="fa fa-clock-o text-[#4f9ef8]" /> Payout History</h4>
                  {[
                    { date: 'Jun 28', amount: '$3,200', status: 'Completed', color: '#10b981' },
                    { date: 'Jun 15', amount: '$1,800', status: 'Completed', color: '#10b981' },
                    { date: 'Jun 01', amount: '$4,500', status: 'Completed', color: '#10b981' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.amount}</p>
                        <p className="text-xs text-gray-400">{p.date}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: p.color, background: p.color + '15' }}>{p.status}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-green-700 flex items-center gap-1.5 mb-1"><i className="fa fa-info-circle" /> Payout Info</p>
                  <p className="text-xs text-green-600">Payouts are processed every Monday. Bank transfers take 1-2 business days.</p>
                </div>
              </div>
            </div>
          )}

          {/* Support */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><i className="fa fa-life-ring text-[#e84545]" /> Help & Support</h3>
                <p className="text-xs text-gray-400 mb-5">Get help or send feedback</p>
                <div className="space-y-3">
                  {[
                    { icon: 'fa-question-circle', color: '#4f9ef8', label: 'Help Center',       desc: 'Browse FAQs and guides'       },
                    { icon: 'fa-comments',         color: '#10b981', label: 'Live Chat',         desc: 'Chat with support team'       },
                    { icon: 'fa-envelope',         color: '#f59e0b', label: 'Email Support',     desc: 'support@matchcreatorz.com'    },
                    { icon: 'fa-flag',             color: '#e84545', label: 'Report an Issue',   desc: 'Report bugs or problems'      },
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
