'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageButton from '@/components/chat/MessageButton';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency, formatBookingAmount } from '@/lib/utils';
import { sellerBookingApi, BookingAttachment } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface BookingUser { id: number; name: string; }
interface Milestone {
  id: number;
  title: string;
  amount: string;
  duration_days: number | null;
  position: number;
  status: 'pending' | 'submitted' | 'countered' | 'approved' | 'rejected';
  counter_amount: string | null;
  counter_by: 'buyer' | 'seller' | null;
  counter_note: string | null;
  attachments: BookingAttachment[];
  notes: string | null;
  dispute_reason: string | null;
}
interface WorkEntry {
  id: number;
  work_date: string;
  description: string | null;
  hours: string;
  rate: string;
  amount: string;
  platform_fee: string;
  status: 'pending' | 'countered' | 'approved' | 'disputed' | 'rejected';
  counter_hours: string | null;
  counter_by: 'buyer' | 'seller' | null;
  counter_note: string | null;
  dispute_reason: string | null;
  attachments: BookingAttachment[];
}
interface Booking {
  id: number;
  title: string;
  amount: string;
  platform_fee: string;
  job_type: string;
  hours_worked: string | null;
  hourly_rate: string | null;
  weekly_hour_limit: string | null;
  status: string;
  notes: string | null;
  cancel_reason: string | null;
  dispute_reason: string | null;
  delivery_days: number | null;
  attachments: BookingAttachment[];
  submission_notes: string | null;
  createdAt: string;
  buyer: BookingUser | null;
  seller: BookingUser | null;
  milestones: Milestone[];
  workEntries: WorkEntry[];
}

const MAX_DELIVERY_DAYS = 365;
const MAX_HOURS = 1000;
// Real-time clamp — `max` on <input type="number"> doesn't stop typing extra digits, only submit-time validation does.
// Keeps partial decimal typing (e.g. "0.") intact; only snaps once the parsed value actually exceeds max.
const clampNumber = (raw: string, max: number) => {
  if (raw === '') return '';
  const cleaned = raw.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return cleaned;
  return num > max ? String(max) : cleaned;
};

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:           { label: 'Pending',       color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  ongoing:           { label: 'Ongoing',       color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  amidst_completion: { label: 'Under Review',  color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  completed:         { label: 'Completed',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  cancelled:         { label: 'Cancelled',     color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'   },
  in_dispute:        { label: 'In Dispute',    color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
};

const MILESTONE_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Not submitted', color: 'bg-gray-100 text-gray-500'   },
  submitted: { label: 'Under review',  color: 'bg-purple-100 text-purple-700' },
  countered: { label: 'Countered',     color: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Paid',          color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',      color: 'bg-red-100 text-red-700'     },
};

const ENTRY_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Under review',  color: 'bg-purple-100 text-purple-700' },
  countered: { label: 'Countered',     color: 'bg-amber-100 text-amber-700'  },
  approved:  { label: 'Paid',          color: 'bg-green-100 text-green-700'  },
  disputed:  { label: 'Disputed',      color: 'bg-red-100 text-red-700'      },
  rejected:  { label: 'Rejected',      color: 'bg-gray-100 text-gray-500'    },
};

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-24 bg-gray-100 rounded-xl" />
      <div className="h-24 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default function SellerBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [acting,    setActing]    = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason,    setReason]    = useState('');

  // Submit-work / submit-milestone form (shared) — fixed-price / milestone bookings only
  const [submitTarget, setSubmitTarget] = useState<{ milestoneId: number | null } | null>(null);
  const [submitFiles,  setSubmitFiles]  = useState<File[]>([]);
  const [submitNotes,  setSubmitNotes]  = useState('');
  const [submitDuration, setSubmitDuration] = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  // Log Work form (hourly bookings — one dated entry at a time)
  const [showLogWork, setShowLogWork]   = useState(false);
  const [logDate,     setLogDate]       = useState('');
  const [logDesc,      setLogDesc]      = useState('');
  const [logHours,     setLogHours]     = useState('');
  const [logFiles,     setLogFiles]     = useState<File[]>([]);
  const [loggingWork,  setLoggingWork]  = useState(false);
  const [entryActing,  setEntryActing]  = useState<number | null>(null);

  // Seller re-counters the buyer's counter on an entry
  const [sellerCounterEntryId, setSellerCounterEntryId] = useState<number | null>(null);
  const [sellerCounterHours,   setSellerCounterHours]   = useState('');
  const [sellerCounterNote,    setSellerCounterNote]    = useState('');

  // Seller re-counters the buyer's counter on a milestone
  const [milestoneActing, setMilestoneActing] = useState<number | null>(null);
  const [sellerCounterMilestoneId, setSellerCounterMilestoneId] = useState<number | null>(null);
  const [sellerCounterAmount,      setSellerCounterAmount]      = useState('');
  const [sellerCounterMilestoneNote, setSellerCounterMilestoneNote] = useState('');

  // Milestone setup form
  const [showMilestoneSetup, setShowMilestoneSetup] = useState(false);
  const [milestoneRows, setMilestoneRows] = useState([{ title: '', amount: '', duration_days: '' }, { title: '', amount: '', duration_days: '' }]);
  const [settingUp, setSettingUp] = useState(false);

  const fetchBooking = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await sellerBookingApi.get(Number(id));
      setBooking(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load booking');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const doAction = async (action: () => Promise<unknown>, msg: string, redirectBack = false) => {
    setActing(true); setActionMsg('');
    try {
      await action();
      setActionMsg(msg);
      setTimeout(() => {
        setActionMsg(''); setShowCancel(false); setReason('');
        if (redirectBack) router.push('/seller/bookings');
        else fetchBooking();
      }, 1200);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally { setActing(false); }
  };

  // ── Submit work / submit milestone (fixed-price / milestone bookings) ──
  const openSubmitForm = (milestoneId: number | null) => {
    setSubmitTarget({ milestoneId });
    setSubmitFiles([]);
    setSubmitNotes('');
    setSubmitDuration('');
  };

  const uploadAll = async (files: File[]): Promise<BookingAttachment[]> => {
    const out: BookingAttachment[] = [];
    for (const file of files) {
      const res = await sellerBookingApi.uploadAttachment(file);
      out.push(res.data);
    }
    return out;
  };

  const handleSubmit = async () => {
    if (!booking || !submitTarget) return;
    setSubmitting(true);
    try {
      const attachments = await uploadAll(submitFiles);
      const duration = submitDuration ? Number(submitDuration) : undefined;
      if (submitTarget.milestoneId == null) {
        await sellerBookingApi.submit(booking.id, { attachments, notes: submitNotes || undefined, delivery_days: duration });
        toast.success('Work submitted for review!');
      } else {
        await sellerBookingApi.submitMilestone(booking.id, submitTarget.milestoneId, { attachments, notes: submitNotes || undefined, duration_days: duration });
        toast.success('Milestone submitted for review!');
      }
      setSubmitTarget(null);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  // ── Log Work (hourly bookings — one dated entry at a time) ──────────────
  const openLogWork = () => {
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogDesc('');
    setLogHours('');
    setLogFiles([]);
    setShowLogWork(true);
  };

  const handleLogWork = async () => {
    if (!booking) return;
    const hours = Number(logHours);
    if (!logDate) { toast.error('Pick a date'); return; }
    if (!hours || hours <= 0) { toast.error('Enter the hours worked'); return; }
    setLoggingWork(true);
    try {
      const attachments = await uploadAll(logFiles);
      await sellerBookingApi.submitWorkEntry(booking.id, { work_date: logDate, description: logDesc || undefined, hours, attachments });
      toast.success('Hours logged for review!');
      setShowLogWork(false);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to log work');
    } finally { setLoggingWork(false); }
  };

  const handleSellerCounter = async () => {
    if (!booking || sellerCounterEntryId == null) return;
    const hours = Number(sellerCounterHours);
    if (!hours || hours <= 0) { toast.error('Enter a valid hours value'); return; }
    setEntryActing(sellerCounterEntryId);
    try {
      await sellerBookingApi.counterWorkEntryBySeller(booking.id, sellerCounterEntryId, { counter_hours: hours, counter_note: sellerCounterNote || undefined });
      toast.success('Counter sent to buyer');
      setSellerCounterEntryId(null);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send counter');
    } finally { setEntryActing(null); }
  };

  const handleAcceptCounter = async (entryId: number) => {
    if (!booking) return;
    setEntryActing(entryId);
    try {
      await sellerBookingApi.acceptWorkEntryCounter(booking.id, entryId);
      toast.success('Counter accepted — paid!');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept counter');
    } finally { setEntryActing(null); }
  };

  const handleAcceptMilestoneCounter = async (milestoneId: number) => {
    if (!booking) return;
    setMilestoneActing(milestoneId);
    try {
      await sellerBookingApi.acceptMilestoneCounter(booking.id, milestoneId);
      toast.success('Counter accepted — paid!');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept counter');
    } finally { setMilestoneActing(null); }
  };

  const handleSellerCounterMilestone = async () => {
    if (!booking || sellerCounterMilestoneId == null) return;
    const amount = Number(sellerCounterAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setMilestoneActing(sellerCounterMilestoneId);
    try {
      await sellerBookingApi.counterMilestoneBySeller(booking.id, sellerCounterMilestoneId, { counter_amount: amount, counter_note: sellerCounterMilestoneNote || undefined });
      toast.success('Counter sent to buyer');
      setSellerCounterMilestoneId(null);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send counter');
    } finally { setMilestoneActing(null); }
  };

  // ── Milestone setup ─────────────────────────────────────────────────────
  const updateRow = (i: number, field: 'title' | 'amount' | 'duration_days', value: string) =>
    setMilestoneRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addRow    = () => setMilestoneRows((prev) => [...prev, { title: '', amount: '', duration_days: '' }]);
  const removeRow = (i: number) => setMilestoneRows((prev) => prev.filter((_, idx) => idx !== i));

  const milestoneSum = milestoneRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const handleCreateMilestones = async () => {
    if (!booking) return;
    setSettingUp(true);
    try {
      await sellerBookingApi.createMilestones(
        booking.id,
        milestoneRows.map((r) => ({
          title: r.title.trim(),
          amount: Number(r.amount),
          duration_days: r.duration_days ? Number(r.duration_days) : null,
        })),
      );
      toast.success('Milestones set up!');
      setShowMilestoneSetup(false);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to set up milestones');
    } finally { setSettingUp(false); }
  };

  const hasMilestones = (b: Booking) => Array.isArray(b.milestones) && b.milestones.length > 0;

  return (
    <DashboardLayout role="SELLER" title="Booking Details">
      <button onClick={() => router.push('/seller/bookings')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e84545] mb-4 transition-colors">
        <i className="fa fa-arrow-left" />Back to Bookings
      </button>

      {loading ? (
        <Card padding="md"><Skeleton /></Card>
      ) : error || !booking ? (
        <Card padding="md">
          <div className="p-8 text-center">
            <i className="fa fa-exclamation-circle text-3xl text-red-300 mb-3 block" />
            <p className="text-sm text-red-600 mb-3">{error || 'Booking not found'}</p>
            <button onClick={() => fetchBooking()} className="text-xs underline text-gray-500">Retry</button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card padding="md">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{booking.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Avatar name={booking.buyer?.name || 'Buyer'} size="xs" />
                      <span className="text-sm text-gray-500">{booking.buyer?.name}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_CFG[booking.status]?.color}`}>
                    {STATUS_CFG[booking.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: booking.job_type === 'hourly' ? (booking.hours_worked != null ? 'Total' : 'Rate') : 'Amount',
                      value: formatBookingAmount(booking).primary, sub: formatBookingAmount(booking).subtitle, highlight: true },
                    { label: 'Platform Fee', value: formatCurrency(Number(booking.platform_fee))               },
                    { label: 'Delivery',     value: booking.delivery_days ? `${booking.delivery_days} days` : '-' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">{i.label}</p>
                      <p className={`font-semibold text-sm mt-0.5 ${i.highlight ? 'text-[#e84545]' : 'text-gray-800'}`}>{i.value}</p>
                      {i.sub && <p className="text-[10px] text-gray-400 mt-0.5">{i.sub}</p>}
                    </div>
                  ))}
                </div>

                {booking.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buyer Notes</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{booking.notes}</p>
                  </div>
                )}

                {booking.dispute_reason && (
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Dispute Reason</p>
                    <p className="text-sm text-gray-700 bg-red-50 rounded-xl p-3">{booking.dispute_reason}</p>
                  </div>
                )}

                {/* Whole-booking submitted work (non-milestone only) */}
                {!hasMilestones(booking) && (booking.submission_notes || booking.attachments?.length > 0) && (
                  <div className="space-y-2">
                    {booking.submission_notes && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Message</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{booking.submission_notes}</p>
                      </div>
                    )}
                    {booking.attachments?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Submitted Files</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.attachments.map((a, i) => (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 transition">
                              <i className="fa fa-paperclip text-[#e84545]" /><span className="max-w-[160px] truncate">{a.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Hourly work entries — running breakdown, one row per logged day */}
            {booking.job_type === 'hourly' && (
              <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hourly Breakdown</p>
                  {booking.weekly_hour_limit && (
                    <p className="text-[11px] text-gray-400">Weekly limit: {booking.weekly_hour_limit}h</p>
                  )}
                </div>
                {booking.workEntries.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No hours logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {booking.workEntries.map((e) => {
                      const ecfg = ENTRY_CFG[e.status];
                      return (
                        <div key={e.id} className="border border-gray-100 rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">{e.work_date}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ecfg.color}`}>{ecfg.label}</span>
                          </div>
                          {e.description && <p className="text-xs text-gray-500 mt-1">{e.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {e.hours}h &times; {formatCurrency(Number(e.rate))}/hr = <strong className="text-gray-700">{formatCurrency(Number(e.amount))}</strong>
                          </p>
                          {e.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {e.attachments.map((a, i) => (
                                <a key={i} href={a.url} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-700 transition">
                                  <i className="fa fa-paperclip text-[#e84545]" /><span className="max-w-[120px] truncate">{a.name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          {e.status === 'countered' && e.counter_by === 'buyer' && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                              <p className="text-xs text-amber-800">
                                Buyer offered to pay for <strong>{e.counter_hours}h</strong> instead of {e.hours}h
                                {e.counter_note && <span className="block text-amber-700 mt-0.5">&ldquo;{e.counter_note}&rdquo;</span>}
                              </p>
                              <div className="flex gap-3 mt-2">
                                <button onClick={() => handleAcceptCounter(e.id)} disabled={entryActing === e.id}
                                  className="text-xs font-semibold text-[#e84545] hover:underline disabled:opacity-60">
                                  {entryActing === e.id ? 'Processing...' : `Accept ${e.counter_hours}h`}
                                </button>
                                <button onClick={() => { setSellerCounterEntryId(e.id); setSellerCounterHours(''); setSellerCounterNote(''); }}
                                  disabled={entryActing === e.id}
                                  className="text-xs font-semibold text-gray-600 hover:underline disabled:opacity-60">
                                  Counter Back
                                </button>
                              </div>
                            </div>
                          )}
                          {e.status === 'countered' && e.counter_by === 'seller' && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                              You offered {e.counter_hours}h — waiting for buyer to respond.
                            </p>
                          )}
                          {e.status === 'disputed' && e.dispute_reason && (
                            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mt-2">{e.dispute_reason}</p>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-xs text-gray-500 pt-1 px-1">
                      <span>Total logged</span>
                      <strong>{booking.workEntries.reduce((s, e) => s + Number(e.hours), 0)}h</strong>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Milestones section */}
            {hasMilestones(booking) && (
              <Card padding="md">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Milestones</p>
                <div className="space-y-2">
                  {booking.milestones.map((m) => {
                    const mcfg = MILESTONE_CFG[m.status];
                    return (
                      <div key={m.id} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${mcfg.color}`}>{mcfg.label}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            {formatCurrency(Number(m.amount))}
                            {m.duration_days ? <span className="ml-2 text-gray-300">&middot; {m.duration_days} day{m.duration_days > 1 ? 's' : ''}</span> : null}
                          </p>
                          {['pending', 'rejected'].includes(m.status) && ['ongoing', 'in_dispute'].includes(booking.status) && (
                            <button onClick={() => openSubmitForm(m.id)}
                              className="text-xs font-semibold text-[#e84545] hover:underline">
                              {m.status === 'rejected' ? 'Resubmit' : 'Submit'}
                            </button>
                          )}
                        </div>
                        {m.status === 'rejected' && m.dispute_reason && (
                          <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mt-2">{m.dispute_reason}</p>
                        )}
                        {m.notes && m.status !== 'rejected' && (
                          <p className="text-xs text-gray-500 mt-1">{m.notes}</p>
                        )}
                        {m.status === 'countered' && m.counter_by === 'buyer' && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <p className="text-xs text-amber-800">
                              Buyer offered to pay <strong>{formatCurrency(Number(m.counter_amount))}</strong> instead of {formatCurrency(Number(m.amount))}
                              {m.counter_note && <span className="block text-amber-700 mt-0.5">&ldquo;{m.counter_note}&rdquo;</span>}
                            </p>
                            <div className="flex gap-3 mt-2">
                              <button onClick={() => handleAcceptMilestoneCounter(m.id)} disabled={milestoneActing === m.id}
                                className="text-xs font-semibold text-[#e84545] hover:underline disabled:opacity-60">
                                {milestoneActing === m.id ? 'Processing...' : `Accept ${formatCurrency(Number(m.counter_amount))}`}
                              </button>
                              <button onClick={() => { setSellerCounterMilestoneId(m.id); setSellerCounterAmount(''); setSellerCounterMilestoneNote(''); }}
                                disabled={milestoneActing === m.id}
                                className="text-xs font-semibold text-gray-600 hover:underline disabled:opacity-60">
                                Counter Back
                              </button>
                            </div>
                          </div>
                        )}
                        {m.status === 'countered' && m.counter_by === 'seller' && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                            You offered {formatCurrency(Number(m.counter_amount))} — waiting for buyer to respond.
                          </p>
                        )}
                        {m.attachments?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {m.attachments.map((a, i) => (
                              <a key={i} href={a.url} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-700 transition">
                                <i className="fa fa-paperclip text-[#e84545]" /><span className="max-w-[120px] truncate">{a.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar — actions */}
          <div className="space-y-4">
            <Card padding="md">
              <div className="space-y-3">
                {booking.buyer?.id && <MessageButton recipientId={booking.buyer.id} role="seller" label="Chat with Buyer" />}

                {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}

                {booking.status === 'pending' && (
                  <>
                    <Button variant="primary" fullWidth disabled={acting}
                      onClick={() => doAction(() => sellerBookingApi.accept(booking.id), 'Order accepted!')}>
                      {acting ? 'Processing...' : 'Accept Order'}
                    </Button>
                    <Button variant="outline" fullWidth className="text-red-600 border-red-200"
                      onClick={() => setShowCancel(true)}>
                      Decline
                    </Button>
                  </>
                )}

                {booking.status === 'ongoing' && booking.job_type === 'hourly' && (
                  <>
                    <Button variant="primary" fullWidth disabled={acting} onClick={openLogWork}>
                      Log Work
                    </Button>
                    <button onClick={() => setShowCancel(true)}
                      className="w-full text-xs text-red-500 hover:underline text-center pt-1">
                      Cancel this booking
                    </button>
                  </>
                )}

                {['ongoing', 'in_dispute'].includes(booking.status) && booking.job_type !== 'hourly' && !hasMilestones(booking) && (
                  <>
                    <Button variant="primary" fullWidth disabled={acting} onClick={() => openSubmitForm(null)}>
                      {booking.status === 'in_dispute' ? 'Resubmit Work' : 'Submit Work for Review'}
                    </Button>
                    {booking.status === 'ongoing' && (
                      <button onClick={() => setShowMilestoneSetup(true)}
                        className="w-full text-xs text-gray-500 hover:text-[#e84545] hover:underline text-center">
                        <i className="fa fa-flag-checkered mr-1" />Split into milestones instead
                      </button>
                    )}
                    {booking.status === 'in_dispute' ? (
                      <Button variant="outline" fullWidth className="text-amber-700 border-amber-300"
                        onClick={() => router.push('/seller/support')}>
                        Chat with Support
                      </Button>
                    ) : (
                      <button onClick={() => setShowCancel(true)}
                        className="w-full text-xs text-red-500 hover:underline text-center pt-1">
                        Cancel this booking
                      </button>
                    )}
                  </>
                )}

                {!['pending', 'ongoing', 'in_dispute'].includes(booking.status) && (
                  <p className="text-xs text-gray-400 text-center">No actions available for this booking.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Decline/cancel confirm */}
      {showCancel && booking && (
        <Modal isOpen onClose={() => { setShowCancel(false); setReason(''); }}
          title={booking.status === 'pending' ? 'Decline Order' : 'Cancel Booking'} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {booking.status === 'pending' ? 'Decline' : 'Cancel'} booking: <strong>{booking.title}</strong>?
            </p>
            {booking.status === 'ongoing' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <i className="fa fa-exclamation-triangle mr-1" />
                You already agreed to these terms — cancelling now notifies the buyer and ends the booking.
              </p>
            )}
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder={booking.status === 'pending' ? 'Reason for declining (optional)' : 'Reason for cancelling (optional)'}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545]" />
            {actionMsg && <p className="text-sm text-center font-medium text-red-600">{actionMsg}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setShowCancel(false); setReason(''); }}>Back</Button>
              <Button variant="primary" fullWidth disabled={acting}
                onClick={() => doAction(() => sellerBookingApi.cancel(booking.id, reason || undefined),
                  booking.status === 'pending' ? 'Order declined' : 'Booking cancelled', true)}>
                {acting ? 'Processing...' : booking.status === 'pending' ? 'Confirm Decline' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit work / submit milestone form */}
      {submitTarget && (
        <Modal isOpen onClose={() => !submitting && setSubmitTarget(null)}
          title={submitTarget.milestoneId == null ? 'Submit Work' : 'Submit Milestone'} size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Message for the buyer</label>
              <textarea value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} rows={3}
                placeholder="Describe what you delivered..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Duration (optional)</label>
              <div className="relative">
                <input type="number" min={1} max={MAX_DELIVERY_DAYS} value={submitDuration} onChange={(e) => setSubmitDuration(clampNumber(e.target.value, MAX_DELIVERY_DAYS))}
                  placeholder="Days taken to deliver"
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-14 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Attach files (optional)</label>
              <input type="file" multiple
                onChange={(e) => setSubmitFiles(Array.from(e.target.files || []))}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs hover:file:bg-gray-200" />
              {submitFiles.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">{submitFiles.length} file{submitFiles.length > 1 ? 's' : ''} selected</p>
              )}
            </div>
            <Button variant="primary" fullWidth disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Log Work form (hourly bookings) */}
      {showLogWork && booking && (
        <Modal isOpen onClose={() => !loggingWork && setShowLogWork(false)} title="Log Work" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Hours <span className="font-normal text-gray-400 normal-case">(at {formatCurrency(Number(booking.hourly_rate))}/hr)</span>
              </label>
              <div className="relative">
                <input type="number" min={0.25} max={MAX_HOURS} step={0.25} value={logHours} onChange={(e) => setLogHours(clampNumber(e.target.value, MAX_HOURS))}
                  placeholder="e.g. 5"
                  className="w-full border border-gray-200 rounded-xl pl-3 pr-14 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">hrs</span>
              </div>
              {logHours && Number(logHours) > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {logHours} hrs &times; {formatCurrency(Number(booking.hourly_rate))}/hr = <strong className="text-gray-800">{formatCurrency(Number(logHours) * Number(booking.hourly_rate))}</strong> total
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description (optional)</label>
              <textarea value={logDesc} onChange={(e) => setLogDesc(e.target.value)} rows={3}
                placeholder="What did you work on..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Attach files (optional)</label>
              <input type="file" multiple
                onChange={(e) => setLogFiles(Array.from(e.target.files || []))}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs hover:file:bg-gray-200" />
              {logFiles.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">{logFiles.length} file{logFiles.length > 1 ? 's' : ''} selected</p>
              )}
            </div>
            <Button variant="primary" fullWidth disabled={loggingWork} onClick={handleLogWork}>
              {loggingWork ? 'Logging...' : 'Log Work for Review'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Counter back the buyer's counter */}
      {sellerCounterEntryId != null && booking && (
        <Modal isOpen onClose={() => entryActing == null && setSellerCounterEntryId(null)} title="Counter Back" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Propose a different hours value back to the buyer
              {(() => {
                const e = booking.workEntries.find((x) => x.id === sellerCounterEntryId);
                return e ? ` (they offered ${e.counter_hours}h, you logged ${e.hours}h)` : '';
              })()}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hours you&apos;ll accept</label>
              <input type="number" min={0.25} step={0.25} value={sellerCounterHours} onChange={(e) => setSellerCounterHours(e.target.value)}
                placeholder="e.g. 4"
                className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
            </div>
            <textarea value={sellerCounterNote} onChange={(e) => setSellerCounterNote(e.target.value)} rows={3}
              placeholder="Explain why (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setSellerCounterEntryId(null)}>Back</Button>
              <Button variant="primary" fullWidth disabled={entryActing === sellerCounterEntryId} onClick={handleSellerCounter}>
                {entryActing === sellerCounterEntryId ? 'Sending...' : 'Send Counter'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Counter back the buyer's counter on a milestone */}
      {sellerCounterMilestoneId != null && booking && (
        <Modal isOpen onClose={() => milestoneActing == null && setSellerCounterMilestoneId(null)} title="Counter Back" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Propose a different amount back to the buyer
              {(() => {
                const m = booking.milestones.find((x) => x.id === sellerCounterMilestoneId);
                return m ? ` (they offered ${formatCurrency(Number(m.counter_amount))}, you submitted ${formatCurrency(Number(m.amount))})` : '';
              })()}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Amount you&apos;ll accept</label>
              <input type="number" min={1} step={0.01} value={sellerCounterAmount} onChange={(e) => setSellerCounterAmount(e.target.value)}
                placeholder="e.g. 125"
                className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
            </div>
            <textarea value={sellerCounterMilestoneNote} onChange={(e) => setSellerCounterMilestoneNote(e.target.value)} rows={3}
              placeholder="Explain why (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setSellerCounterMilestoneId(null)}>Back</Button>
              <Button variant="primary" fullWidth disabled={milestoneActing === sellerCounterMilestoneId} onClick={handleSellerCounterMilestone}>
                {milestoneActing === sellerCounterMilestoneId ? 'Sending...' : 'Send Counter'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Milestone setup form */}
      {showMilestoneSetup && booking && (
        <Modal isOpen onClose={() => !settingUp && setShowMilestoneSetup(false)} title="Split into Milestones" size="lg">
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Amounts must add up to the booking total: <b className="text-gray-700">{formatCurrency(Number(booking.amount))}</b>
            </p>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Title</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-24">Amount</span>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-28">Duration</span>
              <span className="w-5" />
            </div>
            <div className="space-y-2">
              {milestoneRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <input value={row.title} onChange={(e) => updateRow(i, 'title', e.target.value)}
                    placeholder={`Milestone ${i + 1} title`}
                    className="border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                  <input type="number" value={row.amount} onChange={(e) => updateRow(i, 'amount', e.target.value)}
                    placeholder="$"
                    className="w-24 border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                  <div className="relative w-28">
                    <input type="number" min={1} value={row.duration_days} onChange={(e) => updateRow(i, 'duration_days', e.target.value)}
                      placeholder="Days"
                      className="w-full border border-gray-200 rounded-xl pl-3 pr-10 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
                  </div>
                  {milestoneRows.length > 2 ? (
                    <button onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500 px-1 w-5">
                      <i className="fa fa-times" />
                    </button>
                  ) : <span className="w-5" />}
                </div>
              ))}
            </div>
            <button onClick={addRow} className="text-xs text-[#e84545] font-semibold hover:underline">
              <i className="fa fa-plus mr-1" />Add another milestone
            </button>
            <div className={`text-sm text-center rounded-xl p-2 ${milestoneSum === Number(booking.amount) ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              Total: {formatCurrency(milestoneSum)} / {formatCurrency(Number(booking.amount))}
            </div>
            <Button variant="primary" fullWidth disabled={settingUp || milestoneSum !== Number(booking.amount)} onClick={handleCreateMilestones}>
              {settingUp ? 'Setting up...' : 'Create Milestones'}
            </Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
