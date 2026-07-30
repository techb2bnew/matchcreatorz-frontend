'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { preferencesApi, supportApi, feedbackApi, walletApi, profileApi } from '@/lib/adminApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface WalletTxnRow { id: number; amount: string | number; type: string; note?: string; created_at?: string; createdAt?: string }

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  // Email Support form
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject]   = useState('');
  const [emailMessage, setEmailMessage]   = useState('');
  const [emailSending, setEmailSending]   = useState(false);

  const submitEmailSupport = async () => {
    if (!emailMessage.trim()) { toast.error('Please enter a message'); return; }
    setEmailSending(true);
    try {
      await supportApi.open({ subject: emailSubject.trim() || undefined, body: emailMessage.trim() });
      toast.success('Message sent to support!');
      setShowEmailForm(false);
      setEmailSubject(''); setEmailMessage('');
      router.push('/buyer/support');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setEmailSending(false);
    }
  };

  // Send Feedback form
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) { toast.error('Please enter a message'); return; }
    setFeedbackSending(true);
    try {
      await feedbackApi.send('buyer', { subject: feedbackSubject.trim() || undefined, message: feedbackMessage.trim() });
      toast.success('Feedback sent — thank you!');
      setFeedbackSubject(''); setFeedbackMessage('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send feedback');
    } finally {
      setFeedbackSending(false);
    }
  };

  // Delete Account
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm'); return;
    }
    setDeletingAccount(true);
    try {
      await profileApi.deleteAccount('buyer', deleteReason.trim() || undefined);
      Cookies.remove('mc_token'); Cookies.remove('mc_user_type');
      toast.success('Account deleted');
      router.push('/login');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

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
  const [walletTxns, setWalletTxns]     = useState<WalletTxnRow[]>([]);
  const [walletTxnsLoading, setWalletTxnsLoading] = useState(true);

  useEffect(() => {
    walletApi.transactions({ limit: 4 })
      .then(r => setWalletTxns(r.data || []))
      .catch(() => setWalletTxns([]))
      .finally(() => setWalletTxnsLoading(false));
  }, []);

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
            <button onClick={() => { setShowDeleteAccount(true); setDeleteConfirmText(''); setDeleteReason(''); }}
              className="w-full border border-red-300 text-[#e84545] rounded-xl py-2 text-xs font-semibold hover:bg-red-100 transition">
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
                <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <i className="fa fa-credit-card text-[#e84545]" /> Wallet Settings
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Coming Soon</span>
                </h3>
                <p className="text-xs text-gray-400 mb-5">Automatic wallet top-ups aren&apos;t available yet — for now, add money manually from the Wallet page whenever you need to.</p>
                <div className="space-y-4 opacity-50 pointer-events-none select-none">
                  <div>
                    <label className={labelCls}>Auto-Reload Amount ($)</label>
                    <input className={inputCls} type="number" value={reloadAmount} readOnly placeholder="1000" />
                    <p className="text-xs text-gray-400 mt-1">Reload when balance drops below $200</p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Auto Reload</p>
                      <p className="text-xs text-gray-400 mt-0.5">Automatically add money when low</p>
                    </div>
                    <Toggle on={autoReload} onChange={() => {}} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i className="fa fa-clock-o text-[#4f9ef8]" /> Recent Transactions</h4>
                  {walletTxnsLoading ? (
                    <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
                  ) : walletTxns.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No transactions yet</p>
                  ) : (
                    walletTxns.map((t) => {
                      const amt = Number(t.amount);
                      const credit = amt > 0;
                      return (
                        <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">{t.note || t.type}</p>
                            <p className="text-xs text-gray-400">{formatDate(t.created_at || t.createdAt || '')}</p>
                          </div>
                          <span className="text-sm font-bold flex-shrink-0" style={{ color: credit ? '#10b981' : '#e84545' }}>
                            {credit ? '+' : '-'}{formatCurrency(Math.abs(amt))}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1"><i className="fa fa-info-circle" /> Wallet Info</p>
                  <p className="text-xs text-blue-600">Wallet funds are used to pay for bookings and are charged only once you accept delivered work. Visit the Wallet page for your full transaction history.</p>
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
                    { icon: 'fa-question-circle', color: '#4f9ef8', label: 'Help Center',     desc: 'Browse FAQs and guides',    action: () => router.push('/buyer/support') },
                    { icon: 'fa-envelope',         color: '#f59e0b', label: 'Email Support',   desc: 'support@matchcreatorz.com', action: () => setShowEmailForm(true) },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#e8e8e8] shadow-sm hover:border-[#e84545] hover:bg-red-50 transition text-left">
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
                    <input className={inputCls} placeholder="e.g. Feature request" value={feedbackSubject} onChange={e => setFeedbackSubject(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Message</label>
                    <textarea
                      className="w-full border border-[#e8e8e8] shadow-sm rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition h-32 resize-none"
                      placeholder="Tell us what you think..."
                      value={feedbackMessage}
                      onChange={e => setFeedbackMessage(e.target.value)}
                    />
                  </div>
                  <button onClick={submitFeedback} disabled={feedbackSending}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm w-full justify-center disabled:opacity-60">
                    <i className={`fa ${feedbackSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} /> {feedbackSending ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <Modal isOpen={showDeleteAccount} onClose={() => !deletingAccount && setShowDeleteAccount(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <i className="fa fa-exclamation-triangle mr-1.5" />
            This permanently deletes your account and history. This cannot be undone.
          </div>
          <div>
            <label className={labelCls}>Reason (optional)</label>
            <textarea className="w-full border border-[#e8e8e8] shadow-sm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition h-20 resize-none"
              placeholder="Why are you leaving?" value={deleteReason} onChange={e => setDeleteReason(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Type DELETE to confirm</label>
            <input className={inputCls} placeholder="DELETE" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowDeleteAccount(false)} disabled={deletingAccount}>Cancel</Button>
            <Button fullWidth variant="danger" disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'} onClick={handleDeleteAccount}>
              {deletingAccount ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEmailForm} onClose={() => !emailSending && setShowEmailForm(false)} title="Email Support" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Send us a message and our support team will get back to you by email.</p>
          <div>
            <label className={labelCls}>Subject</label>
            <input className={inputCls} placeholder="e.g. Refund question" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Message</label>
            <textarea
              className="w-full border border-[#e8e8e8] shadow-sm rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition h-32 resize-none"
              placeholder="Describe your issue or question..."
              value={emailMessage}
              onChange={e => setEmailMessage(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowEmailForm(false)} disabled={emailSending}>Cancel</Button>
            <Button fullWidth onClick={submitEmailSupport} loading={emailSending}>Send</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
