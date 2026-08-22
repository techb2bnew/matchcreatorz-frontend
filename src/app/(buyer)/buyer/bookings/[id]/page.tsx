'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageButton from '@/components/chat/MessageButton';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import StarPicker from '@/components/ui/StarPicker';
import { formatCurrency, formatBookingAmount } from '@/lib/utils';
import { buyerBookingApi, buyerReviewApi, BookingAttachment } from '@/lib/adminApi';
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
  seller: BookingUser | null;
  buyer: BookingUser | null;
  milestones: Milestone[];
  workEntries: WorkEntry[];
  review?: { id: number; rating: number } | null;
}

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:            { label: 'Pending',      color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  ongoing:            { label: 'Ongoing',      color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  amidst_completion:  { label: 'Under Review', color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  completed:          { label: 'Completed',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  cancelled:          { label: 'Cancelled',    color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'   },
  in_dispute:         { label: 'In Dispute',   color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
};

const MILESTONE_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Not submitted', color: 'bg-gray-100 text-gray-500'   },
  submitted: { label: 'Awaiting you',  color: 'bg-purple-100 text-purple-700' },
  countered: { label: 'Countered',     color: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Paid',          color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',      color: 'bg-red-100 text-red-700'     },
};

const ENTRY_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Awaiting you', color: 'bg-purple-100 text-purple-700' },
  countered: { label: 'Countered',    color: 'bg-amber-100 text-amber-700'  },
  approved:  { label: 'Paid',         color: 'bg-green-100 text-green-700'  },
  disputed:  { label: 'Disputed',     color: 'bg-red-100 text-red-700'      },
  rejected:  { label: 'Rejected',     color: 'bg-gray-100 text-gray-500'    },
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

export default function BuyerBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [acting,    setActing]    = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason,    setReason]    = useState('');

  // Milestone reject form
  const [rejectMilestoneId, setRejectMilestoneId] = useState<number | null>(null);
  const [milestoneReason, setMilestoneReason] = useState('');
  const [milestoneActing, setMilestoneActing] = useState(false);

  // Milestone counter form
  const [counterMilestoneId, setCounterMilestoneId] = useState<number | null>(null);
  const [counterAmount,      setCounterAmount]      = useState('');
  const [counterMilestoneNote, setCounterMilestoneNote] = useState('');

  // Accept & Pay (whole booking, non-milestone)
  const [accepting, setAccepting] = useState(false);

  // Work entries (hourly bookings)
  const [entryActing, setEntryActing] = useState<number | null>(null);
  const [counterEntryId, setCounterEntryId] = useState<number | null>(null);
  const [counterHours,   setCounterHours]   = useState('');
  const [counterNote,    setCounterNote]    = useState('');
  const [disputeEntryId, setDisputeEntryId] = useState<number | null>(null);
  const [entryDisputeReason, setEntryDisputeReason] = useState('');

  // Review
  const [reviewOpen,    setReviewOpen]    = useState(false);
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg,     setReviewMsg]     = useState('');

  const fetchBooking = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await buyerBookingApi.get(Number(id));
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
        setActionMsg(''); setShowCancel(false); setShowReject(false); setReason('');
        if (redirectBack) router.push('/buyer/bookings');
        else fetchBooking();
      }, 1200);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally { setActing(false); }
  };

  const acceptWork = async () => {
    if (!booking) return;
    setAccepting(true);
    try {
      await buyerBookingApi.accept(booking.id);
      toast.success('Work accepted — payment released to the seller!');
      // Prompt for a rating right away instead of leaving the buyer to notice
      // a review option after the booking status changes.
      setReviewRating(0); setReviewComment(''); setReviewMsg(''); setReviewOpen(true);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept — please add funds to your wallet and try again');
    } finally { setAccepting(false); }
  };

  const submitReview = async () => {
    if (!booking || reviewRating === 0) { setReviewMsg('Please select a rating'); return; }
    setReviewLoading(true); setReviewMsg('');
    try {
      await buyerReviewApi.create({
        booking_id: booking.id,
        rating:     reviewRating,
        comment:    reviewComment.trim() || undefined,
      });
      setReviewMsg('Review submitted!');
      await fetchBooking();
      setTimeout(() => {
        setReviewOpen(false); setReviewRating(0);
        setReviewComment(''); setReviewMsg('');
      }, 1400);
    } catch (e: unknown) {
      setReviewMsg(e instanceof Error ? e.message : 'Failed to submit review');
    } finally { setReviewLoading(false); }
  };

  const acceptMilestone = async (milestoneId: number) => {
    if (!booking) return;
    setMilestoneActing(true);
    try {
      await buyerBookingApi.acceptMilestone(booking.id, milestoneId);
      toast.success('Milestone accepted — payment released to the seller!');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept — please add funds to your wallet and try again');
    } finally { setMilestoneActing(false); }
  };

  const rejectMilestone = async () => {
    if (!booking || rejectMilestoneId == null) return;
    setMilestoneActing(true);
    try {
      await buyerBookingApi.rejectMilestone(booking.id, rejectMilestoneId, milestoneReason || undefined);
      toast.success('Milestone sent back to seller');
      setRejectMilestoneId(null); setMilestoneReason('');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject milestone');
    } finally { setMilestoneActing(false); }
  };

  const openCounterMilestoneForm = (milestoneId: number) => {
    setCounterMilestoneId(milestoneId); setCounterAmount(''); setCounterMilestoneNote('');
  };

  const submitMilestoneCounter = async () => {
    if (!booking || counterMilestoneId == null) return;
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setMilestoneActing(true);
    try {
      await buyerBookingApi.counterMilestone(booking.id, counterMilestoneId, { counter_amount: amount, counter_note: counterMilestoneNote || undefined });
      toast.success('Counter sent to seller');
      setCounterMilestoneId(null);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send counter');
    } finally { setMilestoneActing(false); }
  };

  const hasMilestones = (b: Booking) => Array.isArray(b.milestones) && b.milestones.length > 0;

  // ── Hourly work entries ──────────────────────────────────────────────
  const approveEntry = async (entryId: number) => {
    if (!booking) return;
    setEntryActing(entryId);
    try {
      await buyerBookingApi.approveWorkEntry(booking.id, entryId);
      toast.success('Entry approved — payment released to the seller!');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve — please add funds to your wallet and try again');
    } finally { setEntryActing(null); }
  };

  const openCounterForm = (entryId: number) => {
    setCounterEntryId(entryId); setCounterHours(''); setCounterNote('');
  };

  const submitCounter = async () => {
    if (!booking || counterEntryId == null) return;
    const hours = Number(counterHours);
    if (!hours || hours <= 0) { toast.error('Enter a valid hours value'); return; }
    setEntryActing(counterEntryId);
    try {
      await buyerBookingApi.counterWorkEntry(booking.id, counterEntryId, { counter_hours: hours, counter_note: counterNote || undefined });
      toast.success('Counter sent to seller');
      setCounterEntryId(null);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send counter');
    } finally { setEntryActing(null); }
  };

  const submitDisputeEntry = async () => {
    if (!booking || disputeEntryId == null) return;
    setEntryActing(disputeEntryId);
    try {
      await buyerBookingApi.disputeWorkEntry(booking.id, disputeEntryId, entryDisputeReason || undefined);
      toast.success('Entry sent to dispute');
      setDisputeEntryId(null); setEntryDisputeReason('');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to dispute entry');
    } finally { setEntryActing(null); }
  };

  return (
    <DashboardLayout role="BUYER" title="Booking Details">
      <button onClick={() => router.push('/buyer/bookings')}
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
                      <Avatar name={booking.seller?.name || 'Seller'} size="xs" />
                      <span className="text-sm text-gray-500">{booking.seller?.name}</span>
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{booking.notes}</p>
                  </div>
                )}
                {booking.dispute_reason && (
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Dispute Reason</p>
                    <p className="text-sm text-gray-700 bg-red-50 rounded-xl p-3">{booking.dispute_reason}</p>
                  </div>
                )}
                {booking.cancel_reason && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cancel Reason</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{booking.cancel_reason}</p>
                  </div>
                )}

                {/* Whole-booking submitted work (non-milestone only) */}
                {!hasMilestones(booking) && (booking.submission_notes || booking.attachments?.length > 0) && (
                  <div className="space-y-2">
                    {booking.submission_notes && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Seller&apos;s Message</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{booking.submission_notes}</p>
                      </div>
                    )}
                    {booking.attachments?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Delivered Files</p>
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

            {/* Hourly work entries */}
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

                          {e.status === 'countered' && e.counter_by === 'seller' && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                              <p className="text-xs text-amber-800">
                                Seller countered back with <strong>{e.counter_hours}h</strong> (originally logged {e.hours}h)
                                {e.counter_note && <span className="block text-amber-700 mt-0.5">&ldquo;{e.counter_note}&rdquo;</span>}
                              </p>
                            </div>
                          )}

                          {(e.status === 'pending' || (e.status === 'countered' && e.counter_by === 'seller')) && (
                            <div className="flex gap-2 mt-2.5">
                              <Button variant="primary" fullWidth disabled={entryActing === e.id}
                                onClick={() => approveEntry(e.id)}>
                                {entryActing === e.id
                                  ? 'Processing...'
                                  : e.status === 'countered' ? `Accept ${e.counter_hours}h` : 'Approve'}
                              </Button>
                              <Button variant="outline" fullWidth disabled={entryActing === e.id}
                                onClick={() => openCounterForm(e.id)}>
                                Counter
                              </Button>
                              {e.status === 'pending' && (
                                <Button variant="outline" fullWidth className="text-red-600 border-red-200" disabled={entryActing === e.id}
                                  onClick={() => { setDisputeEntryId(e.id); setEntryDisputeReason(''); }}>
                                  Dispute
                                </Button>
                              )}
                            </div>
                          )}

                          {e.status === 'countered' && e.counter_by === 'buyer' && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                              Waiting for seller to respond to your offer of {e.counter_hours}h.
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Milestones</p>
                  <p className="text-xs text-gray-500">
                    <span className="text-green-600 font-semibold">{formatCurrency(booking.milestones.filter(m => m.status === 'approved').reduce((s, m) => s + Number(m.amount), 0))} released</span>
                    {' · '}
                    <span className="text-gray-600 font-semibold">
                      {formatCurrency(booking.milestones.filter(m => m.status !== 'approved').reduce((s, m) => s + Number(m.amount), 0))} remaining
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  {booking.milestones.map((m) => {
                    const mcfg = MILESTONE_CFG[m.status];
                    return (
                      <div key={m.id} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${mcfg.color}`}>{mcfg.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatCurrency(Number(m.amount))}
                          {m.duration_days ? <span className="ml-2 text-gray-300">&middot; {m.duration_days} day{m.duration_days > 1 ? 's' : ''}</span> : null}
                        </p>
                        {m.notes && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-2">{m.notes}</p>}
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
                        {m.status === 'countered' && m.counter_by === 'seller' && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <p className="text-xs text-amber-800">
                              Seller countered back with <strong>{formatCurrency(Number(m.counter_amount))}</strong> (originally submitted at {formatCurrency(Number(m.amount))})
                              {m.counter_note && <span className="block text-amber-700 mt-0.5">&ldquo;{m.counter_note}&rdquo;</span>}
                            </p>
                          </div>
                        )}

                        {(m.status === 'submitted' || (m.status === 'countered' && m.counter_by === 'seller')) && (
                          <div className="flex gap-2 mt-2.5">
                            <Button variant="primary" fullWidth disabled={milestoneActing}
                              onClick={() => acceptMilestone(m.id)}>
                              {milestoneActing
                                ? 'Processing...'
                                : m.status === 'countered' ? `Accept ${formatCurrency(Number(m.counter_amount))}` : 'Accept & Pay'}
                            </Button>
                            <Button variant="outline" fullWidth disabled={milestoneActing}
                              onClick={() => openCounterMilestoneForm(m.id)}>
                              Counter
                            </Button>
                            {m.status === 'submitted' && (
                              <Button variant="outline" fullWidth className="text-red-600 border-red-200" disabled={milestoneActing}
                                onClick={() => { setRejectMilestoneId(m.id); setMilestoneReason(''); }}>
                                Reject
                              </Button>
                            )}
                          </div>
                        )}

                        {m.status === 'countered' && m.counter_by === 'buyer' && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                            Waiting for seller to respond to your offer of {formatCurrency(Number(m.counter_amount))}.
                          </p>
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
                {booking.seller?.id && <MessageButton recipientId={booking.seller.id} role="buyer" />}

                {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}

                {booking.status === 'amidst_completion' && !hasMilestones(booking) && (
                  <>
                    <Button variant="primary" fullWidth disabled={accepting}
                      onClick={acceptWork}>
                      {accepting ? 'Processing...' : 'Accept & Pay'}
                    </Button>
                    <Button variant="outline" fullWidth disabled={acting}
                      className="text-red-600 border-red-200"
                      onClick={() => setShowReject(true)}>
                      Reject
                    </Button>
                  </>
                )}

                {['pending', 'ongoing'].includes(booking.status) && (
                  <Button variant="outline" fullWidth className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowCancel(true)}>
                    Cancel Booking
                  </Button>
                )}

                {booking.status === 'completed' && !booking.review && (
                  <Button
                    fullWidth
                    className="bg-yellow-50 border border-yellow-200 !text-yellow-700 hover:bg-yellow-100"
                    onClick={() => { setReviewRating(0); setReviewComment(''); setReviewMsg(''); setReviewOpen(true); }}
                  >
                    <i className="fa fa-star mr-1.5" />Leave Review
                  </Button>
                )}
                {booking.status === 'completed' && booking.review && (
                  <p className="text-xs text-green-600 font-medium text-center flex items-center justify-center gap-1.5">
                    <i className="fa fa-check-circle" />You rated this {booking.review.rating}/5
                  </p>
                )}

                {!['amidst_completion', 'pending', 'ongoing', 'completed'].includes(booking.status) && (
                  <p className="text-xs text-gray-400 text-center">No actions available for this booking.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancel && booking && (
        <Modal isOpen onClose={() => { setShowCancel(false); setReason(''); }} title="Cancel Booking" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Are you sure you want to cancel <strong>{booking.title}</strong>?</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Reason for cancellation (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545]" />
            {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('cancel') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setShowCancel(false); setReason(''); }}>Back</Button>
              <Button variant="primary" fullWidth disabled={acting}
                onClick={() => doAction(() => buyerBookingApi.cancel(booking.id, reason || undefined), 'Booking cancelled', true)}>
                {acting ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject confirm (whole booking) */}
      {showReject && booking && (
        <Modal isOpen onClose={() => { setShowReject(false); setReason(''); }} title="Reject Work" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">What is wrong with the delivered work? This will open a dispute.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Explain the issue..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545]" />
            {actionMsg && <p className="text-sm text-center font-medium text-red-600">{actionMsg}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setShowReject(false); setReason(''); }}>Back</Button>
              <Button variant="primary" fullWidth disabled={acting}
                onClick={() => doAction(() => buyerBookingApi.reject(booking.id, reason || undefined), 'Dispute raised')}>
                {acting ? 'Processing...' : 'Raise Dispute'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject a single milestone */}
      {rejectMilestoneId != null && (
        <Modal isOpen onClose={() => !milestoneActing && setRejectMilestoneId(null)} title="Reject Milestone" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">What needs to change? The seller can resubmit just this milestone.</p>
            <textarea value={milestoneReason} onChange={e => setMilestoneReason(e.target.value)} rows={3}
              placeholder="Explain the issue..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545]" />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setRejectMilestoneId(null)}>Back</Button>
              <Button variant="primary" fullWidth disabled={milestoneActing} onClick={rejectMilestone}>
                {milestoneActing ? 'Processing...' : 'Send Back'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Counter a milestone */}
      {counterMilestoneId != null && booking && (
        <Modal isOpen onClose={() => !milestoneActing && setCounterMilestoneId(null)} title="Counter Milestone" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Propose a different amount than submitted
              {(() => {
                const m = booking.milestones.find((x) => x.id === counterMilestoneId);
                return m ? ` (seller submitted ${formatCurrency(Number(m.amount))})` : '';
              })()}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Amount you&apos;ll pay</label>
              <input type="number" min={1} step={0.01} value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
            </div>
            <textarea value={counterMilestoneNote} onChange={(e) => setCounterMilestoneNote(e.target.value)} rows={3}
              placeholder="Explain why (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCounterMilestoneId(null)}>Back</Button>
              <Button variant="primary" fullWidth disabled={milestoneActing} onClick={submitMilestoneCounter}>
                {milestoneActing ? 'Sending...' : 'Send Counter'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Counter a work entry */}
      {counterEntryId != null && booking && (
        <Modal isOpen onClose={() => !entryActing && setCounterEntryId(null)} title="Counter Hours" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Propose paying for fewer hours than logged
              {(() => {
                const e = booking.workEntries.find((x) => x.id === counterEntryId);
                return e ? ` (seller logged ${e.hours}h)` : '';
              })()}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hours you&apos;ll pay for</label>
              <input type="number" min={0.25} step={0.25} value={counterHours} onChange={(e) => setCounterHours(e.target.value)}
                placeholder="e.g. 3"
                className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
            </div>
            <textarea value={counterNote} onChange={(e) => setCounterNote(e.target.value)} rows={3}
              placeholder="Explain why (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCounterEntryId(null)}>Back</Button>
              <Button variant="primary" fullWidth disabled={entryActing === counterEntryId} onClick={submitCounter}>
                {entryActing === counterEntryId ? 'Sending...' : 'Send Counter'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispute a work entry */}
      {disputeEntryId != null && (
        <Modal isOpen onClose={() => !entryActing && setDisputeEntryId(null)} title="Dispute Entry" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">What&apos;s wrong with this entry? This escalates to our team.</p>
            <textarea value={entryDisputeReason} onChange={(e) => setEntryDisputeReason(e.target.value)} rows={3}
              placeholder="Explain the issue..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545] resize-none" />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setDisputeEntryId(null)}>Back</Button>
              <Button variant="primary" fullWidth disabled={entryActing === disputeEntryId} onClick={submitDisputeEntry}>
                {entryActing === disputeEntryId ? 'Processing...' : 'Raise Dispute'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leave Review */}
      {reviewOpen && booking && (
        <Modal isOpen onClose={() => setReviewOpen(false)} title="Leave a Review" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <Avatar name={booking.seller?.name || 'S'} size="sm" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{booking.seller?.name}</p>
                <p className="text-xs text-gray-400 truncate">{booking.title}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Comment <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this seller..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#e84545] resize-none"
              />
            </div>

            {reviewMsg && (
              <p className={`text-sm text-center font-medium ${reviewMsg.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>
                {reviewMsg.includes('submitted') ? <><i className="fa fa-check-circle mr-1" />{reviewMsg}</> : reviewMsg}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                disabled={reviewLoading || reviewRating === 0}
                onClick={submitReview}
                className="w-full py-2.5 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73a3a] transition-colors disabled:opacity-60"
              >
                {reviewLoading ? <><i className="fa fa-spinner fa-spin mr-1" />Submitting...</> : 'Submit Review'}
              </button>
              <button onClick={() => setReviewOpen(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
