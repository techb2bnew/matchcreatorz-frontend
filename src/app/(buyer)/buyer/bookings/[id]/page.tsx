'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageButton from '@/components/chat/MessageButton';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import EmbeddedCheckoutModal from '@/components/payments/EmbeddedCheckoutModal';
import Button from '@/components/ui/Button';
import StarPicker from '@/components/ui/StarPicker';
import { formatCurrency, formatBookingAmount } from '@/lib/utils';
import { buyerBookingApi, buyerReviewApi, walletApi, BookingAttachment } from '@/lib/adminApi';
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
  payment_type: 'direct' | 'hold';
  payment_status: 'unpaid' | 'held' | 'released';
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
  payment_type: 'direct' | 'hold';
  payment_status: 'unpaid' | 'held' | 'released';
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
  payment_mode: 'wallet' | 'escrow';
  payment_type: 'direct' | 'hold';
  payment_status: 'unpaid' | 'held' | 'released' | 'refunded';
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
  const searchParams = useSearchParams();
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

  // Milestone setup (buyer can split a booking too, same as seller)
  const [showMilestoneSetup, setShowMilestoneSetup] = useState(false);
  const [milestoneRows, setMilestoneRows] = useState([{ title: '', amount: '', duration_days: '' }, { title: '', amount: '', duration_days: '' }]);
  const [settingUp, setSettingUp] = useState(false);

  // Work entries (hourly bookings)
  const [entryActing, setEntryActing] = useState<number | null>(null);
  const [counterEntryId, setCounterEntryId] = useState<number | null>(null);
  const [counterHours,   setCounterHours]   = useState('');
  const [counterNote,    setCounterNote]    = useState('');
  const [disputeEntryId, setDisputeEntryId] = useState<number | null>(null);
  const [entryDisputeReason, setEntryDisputeReason] = useState('');

  // Escrow payment-type choice modal — shared by the whole-booking, milestone,
  // and work-entry Accept flows, so the choice always looks the same instead
  // of two inline buttons per row.
  const [payTarget, setPayTarget] = useState<
    | { kind: 'booking'; label: string | null; amount: number }
    | { kind: 'milestone'; id: number; label: string | null; amount: number }
    | { kind: 'entry'; id: number; label: string | null; amount: number }
    | null
  >(null);
  // "Release Amount" on an already-held payment opens this confirm modal
  // instead of settling immediately — the buyer chooses Confirm Release or
  // Cancel Hold, rather than two separate buttons stacked on the page.
  const [holdTarget, setHoldTarget] = useState<
    | { kind: 'booking' }
    | { kind: 'milestone'; id: number }
    | { kind: 'entry'; id: number }
    | null
  >(null);
  // Set once the backend hands back a Stripe Checkout session to complete —
  // renders inline via EmbeddedCheckoutModal instead of redirecting away.
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [showHoldTerms, setShowHoldTerms] = useState(false);
  // Platform fee rate, for the pre-payment fee breakdown shown below — fetched
  // once since it's an admin-wide setting, not per-booking. 10% fallback
  // matches the backend's own default (config/fee.js) if this hasn't loaded yet.
  const [feePercent, setFeePercent] = useState(10);
  // How long a 'hold' payment may sit uncaptured before it's automatically
  // cancelled (admin-configurable, capped at Stripe's own 7-day authorization
  // ceiling) — shown as the Pay & Hold terms below. 7 fallback matches the
  // backend's own default if this hasn't loaded yet.
  const [holdDays, setHoldDays] = useState(7);
  useEffect(() => {
    walletApi.config().then((res) => {
      if (typeof res?.data?.fee_percent === 'number') setFeePercent(res.data.fee_percent);
      if (typeof res?.data?.escrow_hold_days === 'number') setHoldDays(res.data.escrow_hold_days);
    }).catch(() => {});
  }, []);

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

  // Handle the Stripe Checkout return for an escrow hold/milestone charge —
  // mirrors buyer/wallet/page.tsx's ?topup=success&session_id=... handling.
  useEffect(() => {
    const status = searchParams.get('escrow');
    const sessionId = searchParams.get('session_id');
    if (status === 'success' && sessionId) {
      buyerBookingApi.confirmEscrowCheckout(Number(id), sessionId)
        .then(() => { toast.success('Payment confirmed!'); fetchBooking(); })
        .catch(() => fetchBooking())
        .finally(() => router.replace(`/buyer/bookings/${id}`));
    } else if (status === 'cancel') {
      toast('Payment cancelled'); router.replace(`/buyer/bookings/${id}`);
    }
  }, [searchParams, id, router, fetchBooking]);

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

  const acceptWork = async (paymentType?: 'direct' | 'hold') => {
    if (!booking) return;
    setAccepting(true);
    try {
      const res = await buyerBookingApi.accept(booking.id, paymentType);
      // Escrow mode: the backend doesn't settle synchronously on the first
      // call — it hands back a Stripe Checkout session for this booking's
      // own charge or hold. Rendered inline via EmbeddedCheckoutModal.
      if (res?.data?.escrow && res.data.client_secret) {
        setCheckoutClientSecret(res.data.client_secret);
        return;
      }
      toast.success('Work accepted — payment released to the seller!');
      // Prompt for a rating right away instead of leaving the buyer to notice
      // a review option after the booking status changes.
      setReviewRating(0); setReviewComment(''); setReviewMsg(''); setReviewOpen(true);
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept — please add funds to your wallet and try again');
    } finally { setAccepting(false); }
  };

  // Voluntary release of a Pay & Hold authorization before it's captured —
  // distinct from Reject/Cancel Booking, which pass judgment on the work
  // itself. Only ever enabled while payment_status is still 'held'.
  const cancelBookingHold = async () => {
    if (!booking) return;
    setAccepting(true);
    try {
      await buyerBookingApi.cancelHold(booking.id);
      toast.success('Hold cancelled — no charge was made');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel hold');
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

  const acceptMilestone = async (milestoneId: number, paymentType?: 'direct' | 'hold') => {
    if (!booking) return;
    setMilestoneActing(true);
    try {
      const res = await buyerBookingApi.acceptMilestone(booking.id, milestoneId, paymentType);
      // Escrow mode: the backend doesn't settle synchronously — it hands back
      // a Stripe Checkout session for this milestone's own charge or hold.
      // Rendered inline via EmbeddedCheckoutModal.
      if (res?.data?.escrow && res.data.client_secret) {
        setCheckoutClientSecret(res.data.client_secret);
        return;
      }
      toast.success('Milestone accepted — payment released to the seller!');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept — please add funds to your wallet and try again');
    } finally { setMilestoneActing(false); }
  };

  const cancelMilestoneHold = async (milestoneId: number) => {
    if (!booking) return;
    setMilestoneActing(true);
    try {
      await buyerBookingApi.cancelMilestoneHold(booking.id, milestoneId);
      toast.success('Hold cancelled — no charge was made');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel hold');
    } finally { setMilestoneActing(false); }
  };

  // ── Milestone setup ─────────────────────────────────────────────────────
  const updateMilestoneRow = (i: number, field: 'title' | 'amount' | 'duration_days', value: string) =>
    setMilestoneRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addMilestoneRow    = () => setMilestoneRows((prev) => [...prev, { title: '', amount: '', duration_days: '' }]);
  const removeMilestoneRow = (i: number) => setMilestoneRows((prev) => prev.filter((_, idx) => idx !== i));

  const milestoneSum = milestoneRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const milestoneRowsValid = milestoneRows.every((r) => r.title.trim() && Number(r.amount) > 0);

  const handleCreateMilestones = async () => {
    if (!booking) return;
    setSettingUp(true);
    try {
      await buyerBookingApi.createMilestones(
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
  const approveEntry = async (entryId: number, paymentType?: 'direct' | 'hold') => {
    if (!booking) return;
    setEntryActing(entryId);
    try {
      const res = await buyerBookingApi.approveWorkEntry(booking.id, entryId, paymentType);
      // Escrow mode: the backend doesn't settle synchronously on the first
      // call — it hands back a Stripe Checkout session for this entry's own
      // charge or hold. Rendered inline via EmbeddedCheckoutModal.
      if (res?.data?.escrow && res.data.client_secret) {
        setCheckoutClientSecret(res.data.client_secret);
        return;
      }
      toast.success('Entry approved — payment released to the seller!');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve — please add funds to your wallet and try again');
    } finally { setEntryActing(null); }
  };

  const cancelEntryHold = async (entryId: number) => {
    if (!booking) return;
    setEntryActing(entryId);
    try {
      await buyerBookingApi.cancelWorkEntryHold(booking.id, entryId);
      toast.success('Hold cancelled — no charge was made');
      await fetchBooking();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel hold');
    } finally { setEntryActing(null); }
  };

  // Fired by the payment-choice modal — routes to whichever Accept flow
  // opened it (whole booking, a milestone, or a work entry).
  const choosePayment = async (type: 'direct' | 'hold') => {
    if (!payTarget) return;
    if (payTarget.kind === 'booking') await acceptWork(type);
    else if (payTarget.kind === 'milestone') await acceptMilestone(payTarget.id, type);
    else await approveEntry(payTarget.id, type);
    setPayTarget(null);
  };

  // Whether the action the modal is currently showing is in flight — used to
  // disable both options and show a spinner state, without needing to know
  // which one was actually clicked (there's only ever one modal open).
  const payTargetBusy = payTarget
    ? payTarget.kind === 'booking' ? accepting
      : payTarget.kind === 'milestone' ? milestoneActing
      : entryActing === payTarget.id
    : false;

  // Fired by the release/cancel-hold confirm modal — routes to whichever
  // Release Amount button opened it.
  const confirmRelease = async () => {
    if (!holdTarget) return;
    if (holdTarget.kind === 'booking') await acceptWork();
    else if (holdTarget.kind === 'milestone') await acceptMilestone(holdTarget.id);
    else await approveEntry(holdTarget.id);
    setHoldTarget(null);
  };

  const confirmCancelHold = async () => {
    if (!holdTarget) return;
    if (holdTarget.kind === 'booking') await cancelBookingHold();
    else if (holdTarget.kind === 'milestone') await cancelMilestoneHold(holdTarget.id);
    else await cancelEntryHold(holdTarget.id);
    setHoldTarget(null);
  };

  const holdTargetBusy = holdTarget
    ? holdTarget.kind === 'booking' ? accepting
      : holdTarget.kind === 'milestone' ? milestoneActing
      : entryActing === holdTarget.id
    : false;

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
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CFG[booking.status]?.color}`}>
                      {STATUS_CFG[booking.status]?.label}
                    </span>
                    {booking.payment_mode === 'escrow' && booking.payment_status === 'held' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <i className="fa fa-shield" /> Escrow protected
                      </span>
                    )}
                    {booking.payment_mode === 'escrow' && booking.payment_status === 'unpaid' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                        <i className="fa fa-clock-o" /> Payment on delivery
                      </span>
                    )}
                  </div>
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
                            <div className="flex items-center gap-1.5">
                              {booking.payment_mode === 'escrow' && e.payment_type === 'hold' && e.payment_status === 'held' && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 bg-emerald-100 text-emerald-700">
                                  <i className="fa fa-shield" /> Hold
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ecfg.color}`}>{ecfg.label}</span>
                            </div>
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

                          {(e.status === 'pending' || (e.status === 'countered' && e.counter_by === 'seller')) && (() => {
                            const acting = entryActing === e.id;
                            const settleHours = e.status === 'countered' ? Number(e.counter_hours) : Number(e.hours);
                            const settleAmount = settleHours * Number(e.rate);
                            const counterLabel = e.status === 'countered' ? `${e.counter_hours}h` : null;
                            // First click for an escrow-mode entry — nothing charged or
                            // held yet, so the payment-choice modal opens instead of
                            // settling right away (mirrors the milestone flow).
                            const choosingPayment = booking.payment_mode === 'escrow' && e.payment_status === 'unpaid';
                            // A 'hold' entry that's already held just needs
                            // capturing + releasing now — no new payment is
                            // being accepted here.
                            const isHeld = booking.payment_mode === 'escrow' && e.payment_type === 'hold' && e.payment_status === 'held';
                            return (
                              <>
                                <div className="flex gap-2 mt-2.5">
                                  <Button variant="primary" fullWidth disabled={acting}
                                    onClick={() => choosingPayment
                                      ? setPayTarget({ kind: 'entry', id: e.id, label: counterLabel, amount: settleAmount })
                                      : isHeld
                                        ? setHoldTarget({ kind: 'entry', id: e.id })
                                        : approveEntry(e.id)}>
                                    {acting ? 'Processing...' : isHeld ? 'Release Amount' : counterLabel ? `Accept ${counterLabel}` : 'Approve'}
                                  </Button>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button variant="outline" fullWidth disabled={acting}
                                    onClick={() => openCounterForm(e.id)}>
                                    Counter
                                  </Button>
                                  {e.status === 'pending' && (
                                    <Button variant="outline" fullWidth className="text-red-600 border-red-200" disabled={acting}
                                      onClick={() => { setDisputeEntryId(e.id); setEntryDisputeReason(''); }}>
                                      Dispute
                                    </Button>
                                  )}
                                </div>
                              </>
                            );
                          })()}

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
                          <div className="flex items-center gap-1.5">
                            {booking.payment_mode === 'escrow' && m.payment_type === 'hold' && m.payment_status === 'held' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 bg-emerald-100 text-emerald-700">
                                <i className="fa fa-shield" /> Hold
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${mcfg.color}`}>{mcfg.label}</span>
                          </div>
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

                        {(m.status === 'submitted' || (m.status === 'countered' && m.counter_by === 'seller')) && (() => {
                          const settleAmount = m.status === 'countered' ? Number(m.counter_amount) : Number(m.amount);
                          const amountLabel = m.status === 'countered' ? formatCurrency(settleAmount) : null;
                          // First click for an escrow-mode milestone — nothing charged or
                          // held yet, so the payment-choice modal opens instead of settling
                          // right away. Once a 'hold' choice comes back as held, this
                          // collapses to settling directly (captures + releases it, mirrors
                          // the whole-booking flow); a 'direct' choice settles on its own
                          // once Stripe confirms, so there's no second click for that one.
                          const choosingPayment = booking.payment_mode === 'escrow' && m.payment_status === 'unpaid';
                          // A 'hold' milestone that's already held just needs
                          // capturing + releasing now — no new payment is
                          // being accepted here.
                          const isHeld = booking.payment_mode === 'escrow' && m.payment_type === 'hold' && m.payment_status === 'held';
                          return (
                            <>
                              <div className="flex gap-2 mt-2.5">
                                <Button variant="primary" fullWidth disabled={milestoneActing}
                                  onClick={() => choosingPayment
                                    ? setPayTarget({ kind: 'milestone', id: m.id, label: amountLabel, amount: settleAmount })
                                    : isHeld
                                      ? setHoldTarget({ kind: 'milestone', id: m.id })
                                      : acceptMilestone(m.id)}>
                                  {milestoneActing ? 'Processing...' : isHeld ? 'Release Amount' : amountLabel ? `Accept ${amountLabel}` : 'Accept & Pay'}
                                </Button>
                              </div>
                              <div className="flex gap-2 mt-2">
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
                            </>
                          );
                        })()}

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
                {booking.seller?.id && (
                  <MessageButton recipientId={booking.seller.id} role="buyer" size="md" className="w-full justify-center" />
                )}

                {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}

                {booking.status === 'amidst_completion' && !hasMilestones(booking) && (() => {
                  // A 'hold' booking that's already held just needs capturing
                  // + releasing now — no new payment is being accepted here.
                  const isHeld = booking.payment_mode === 'escrow' && booking.payment_type === 'hold' && booking.payment_status === 'held';
                  return (
                  <>
                    <Button variant="primary" fullWidth disabled={accepting}
                      onClick={() => (booking.payment_mode === 'escrow' && booking.payment_status === 'unpaid')
                        ? setPayTarget({ kind: 'booking', label: null, amount: Number(booking.amount) })
                        : isHeld
                          ? setHoldTarget({ kind: 'booking' })
                          : acceptWork()}>
                      {accepting ? 'Processing...' : isHeld ? 'Release Amount' : 'Accept & Pay'}
                    </Button>
                    <Button variant="outline" fullWidth disabled={acting}
                      className="text-red-600 border-red-200"
                      onClick={() => setShowReject(true)}>
                      Reject
                    </Button>
                  </>
                  );
                })()}

                {booking.status === 'ongoing' && booking.job_type !== 'hourly' && !hasMilestones(booking) && (
                  <Button variant="outline" fullWidth onClick={() => setShowMilestoneSetup(true)}
                    leftIcon={<i className="fa fa-flag-checkered" />}>
                    Split into Milestones
                  </Button>
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
                  <input value={row.title} onChange={(e) => updateMilestoneRow(i, 'title', e.target.value)}
                    placeholder={`Milestone ${i + 1} title`}
                    className="border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                  <input type="number" value={row.amount} onChange={(e) => updateMilestoneRow(i, 'amount', e.target.value)}
                    placeholder="$"
                    className="w-24 border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                  <div className="relative w-28">
                    <input type="number" min={1} value={row.duration_days} onChange={(e) => updateMilestoneRow(i, 'duration_days', e.target.value)}
                      placeholder="Days"
                      className="w-full border border-gray-200 rounded-xl pl-3 pr-10 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
                  </div>
                  {milestoneRows.length > 1 ? (
                    <button onClick={() => removeMilestoneRow(i)} className="text-gray-400 hover:text-red-500 px-1 w-5">
                      <i className="fa fa-times" />
                    </button>
                  ) : <span className="w-5" />}
                </div>
              ))}
            </div>
            <button onClick={addMilestoneRow} className="text-xs text-[#e84545] font-semibold hover:underline">
              <i className="fa fa-plus mr-1" />Add another milestone
            </button>
            <div className={`text-sm text-center rounded-xl p-2 ${milestoneSum === Number(booking.amount) ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
              Total: {formatCurrency(milestoneSum)} / {formatCurrency(Number(booking.amount))}
            </div>
            {milestoneSum === Number(booking.amount) && !milestoneRowsValid && (
              <p className="text-xs text-red-500 text-center -mt-2">Every milestone needs a title and a positive amount</p>
            )}
            <Button variant="primary" fullWidth disabled={settingUp || !milestoneRowsValid || milestoneSum !== Number(booking.amount)} onClick={handleCreateMilestones}>
              {settingUp ? 'Setting up...' : 'Create Milestones'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Payment-choice modal — shared by the whole-booking, milestone, and
          work-entry Accept flows (escrow mode only). */}
      {payTarget && (() => {
        // Platform fee is exact (it's our own configured rate). Stripe's fee
        // isn't knowable until the charge actually happens — this is the
        // standard published US card rate, clearly labeled as an estimate;
        // the real fee is shown on the transaction afterward.
        const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
        const platformFee = round2(payTarget.amount * (feePercent / 100));
        const estStripeFee = round2(payTarget.amount * 0.029 + 0.3);
        return (
        <Modal isOpen onClose={() => !payTargetBusy && setPayTarget(null)} title="Choose How to Pay" size="sm">
          <div className="space-y-3">
            {payTarget.label && (
              <p className="text-sm text-gray-500 text-center">
                Amount: <strong className="text-gray-800">{payTarget.label}</strong>
              </p>
            )}
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Gross payment</span>
                <span className="font-medium text-gray-800">{formatCurrency(payTarget.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee ({feePercent}%)</span>
                <span className="font-medium text-gray-800">{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Processing fee (estimated)</span>
                <span>~{formatCurrency(estStripeFee)}</span>
              </div>
              {/* <p className="text-[11px] text-gray-400 pt-1">
                Stripe&apos;s exact fee is only known once the charge completes — the real figure will show on this payment&apos;s transaction record afterward.
              </p> */}
            </div>
            <button
              disabled={payTargetBusy}
              onClick={() => choosePayment('direct')}
              className="w-full text-left border border-gray-200 hover:border-[#e84545] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl p-4 transition"
            >
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa fa-bolt text-[#e84545]" /> Pay Directly
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Charge your card now — funds are released to the seller right away.
              </p>
            </button>
            <div
              role="button"
              tabIndex={payTargetBusy ? -1 : 0}
              onClick={() => !payTargetBusy && choosePayment('hold')}
              onKeyDown={(e) => { if (!payTargetBusy && (e.key === 'Enter' || e.key === ' ')) choosePayment('hold'); }}
              className={`w-full text-left border border-gray-200 rounded-xl p-4 transition ${payTargetBusy ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#e84545] cursor-pointer'}`}
            >
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa fa-shield text-[#e84545]" /> Pay & Hold
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Authorize your card now — funds are only captured and released once you confirm again after.
              </p>
              <button
                type="button"
                disabled={payTargetBusy}
                onClick={(e) => { e.stopPropagation(); setShowHoldTerms(true); }}
                className="text-[11px] text-[#e84545] underline mt-1.5"
              >
                Terms &amp; Conditions
              </button>
            </div>
            {payTargetBusy && <p className="text-xs text-gray-400 text-center">Processing...</p>}
          </div>
        </Modal>
        );
      })()}

      {/* Release-or-cancel confirm modal — opened by "Release Amount" on an
          already-held payment (whole-booking, milestone, or work entry). */}
      {holdTarget && (
        <Modal isOpen onClose={() => !holdTargetBusy && setHoldTarget(null)} title="Release or Cancel Hold" size="sm">
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Your card was authorized and is waiting on your decision.
            </p>
            <button
              disabled={holdTargetBusy}
              onClick={confirmRelease}
              className="w-full text-left border border-gray-200 hover:border-[#e84545] disabled:opacity-60 disabled:cursor-not-allowed rounded-xl p-4 transition"
            >
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa fa-check-circle text-green-600" /> Confirm Release
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Capture the hold now and release payment to the seller.
              </p>
            </button>
            <button
              disabled={holdTargetBusy}
              onClick={confirmCancelHold}
              className="w-full text-left border border-red-200 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl p-4 transition"
            >
              <p className="font-semibold text-red-600 flex items-center gap-2">
                <i className="fa fa-ban" /> Cancel Hold
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Release the card authorization — no charge is made, you can pay again later.
              </p>
            </button>
            {holdTargetBusy && <p className="text-xs text-gray-400 text-center">Processing...</p>}
          </div>
        </Modal>
      )}

      {showHoldTerms && (
        <Modal isOpen onClose={() => setShowHoldTerms(false)} title="Pay & Hold — Terms & Conditions" size="sm">
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Choosing <strong>Pay &amp; Hold</strong> authorizes your card for the payment amount — this is not an
              immediate charge. No money leaves your account at this step.
            </p>
            <p>
              The hold lasts up to <strong>{holdDays} day{holdDays === 1 ? '' : 's'}</strong>. You (or the seller,
              once work is delivered) must confirm it within that window for it to actually be captured and released.
            </p>
            <p>
              If the hold is not released within {holdDays} day{holdDays === 1 ? '' : 's'}, it is automatically
              cancelled — your card is never charged, and the booking/milestone/entry reverts to unpaid so you can
              try again.
            </p>
            <p className="text-xs text-gray-400">
              This window is configured by MatchCreatorz and can never exceed 7 days, which is Stripe&apos;s own
              maximum authorization period for a card hold.
            </p>
            <Button variant="outline" fullWidth onClick={() => setShowHoldTerms(false)}>Close</Button>
          </div>
        </Modal>
      )}

      {/* Stripe's Embedded Checkout, rendered inline — no redirect to a
          Stripe-hosted page and no new tab. Completion still navigates the
          browser to the return_url the backend set (handled by the
          ?escrow=success effect above); closing this without paying just
          discards the session, nothing was charged. */}
      {checkoutClientSecret && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <EmbeddedCheckoutModal
          clientSecret={checkoutClientSecret}
          publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
          onClose={() => setCheckoutClientSecret(null)}
        />
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
