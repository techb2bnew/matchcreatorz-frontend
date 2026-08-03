'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageButton from '@/components/chat/MessageButton';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency, formatTimeAgo, formatBookingAmount } from '@/lib/utils';
import { buyerBookingApi, buyerReviewApi, BookingAttachment } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface BookingUser { id: number; name: string; }
interface Milestone {
  id: number;
  amount: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}
interface Booking {
  id: number;
  title: string;
  amount: string;
  platform_fee: string;
  job_type: string;
  hours_worked: string | null;
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
}

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:            { label: 'Pending',      color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  ongoing:            { label: 'Ongoing',      color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  amidst_completion:  { label: 'Under Review', color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  completed:          { label: 'Completed',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  cancelled:          { label: 'Cancelled',    color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'   },
  in_dispute:         { label: 'In Dispute',   color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
};

const TABS = ['active', 'completed', 'cancelled'];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <i className={`${(hovered || value) >= i ? 'fa fa-star text-yellow-400' : 'fa fa-star-o text-gray-300'}`} />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {value > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][value] : 'Select rating'}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-5 border-b border-gray-50 animate-pulse flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="h-5 w-20 bg-gray-200 rounded-full" />
      <div className="h-5 w-16 bg-gray-200 rounded" />
    </div>
  );
}

export default function BuyerBookingsPage() {
  const router = useRouter();
  const [tab,      setTab]      = useState('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [acting,    setActing]    = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason,    setReason]    = useState('');

  // Row-level Accept (whole booking) — charges + releases in one click
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // Review state
  const [reviewTarget,  setReviewTarget]  = useState<Booking | null>(null);
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg,     setReviewMsg]     = useState('');
  const [reviewedIds,   setReviewedIds]   = useState<Set<number>>(new Set());

  const fetchBookings = useCallback(async (t: string) => {
    setLoading(true); setError('');
    try {
      const res = await buyerBookingApi.list({ tab: t });
      setBookings(res.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(tab); }, [tab, fetchBookings]);

  const doAction = async (action: () => Promise<unknown>, msg: string) => {
    setActing(true); setActionMsg('');
    try {
      await action();
      setActionMsg(msg);
      setTimeout(() => {
        setSelected(null); setActionMsg('');
        setShowCancel(false); setShowReject(false); setReason('');
        fetchBookings(tab);
      }, 1200);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally { setActing(false); }
  };

  const acceptWork = async (bookingId: number) => {
    setAcceptingId(bookingId);
    try {
      await buyerBookingApi.accept(bookingId);
      toast.success('Work accepted — payment released to the seller!');
      fetchBookings(tab);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept — please add funds to your wallet and try again');
    } finally { setAcceptingId(null); }
  };

  const submitReview = async () => {
    if (!reviewTarget || reviewRating === 0) { setReviewMsg('Please select a rating'); return; }
    setReviewLoading(true); setReviewMsg('');
    try {
      await buyerReviewApi.create({
        booking_id: reviewTarget.id,
        rating:     reviewRating,
        comment:    reviewComment.trim() || undefined,
      });
      setReviewMsg('Review submitted!');
      setReviewedIds(prev => new Set([...prev, reviewTarget.id]));
      setTimeout(() => {
        setReviewTarget(null); setReviewRating(0);
        setReviewComment(''); setReviewMsg('');
      }, 1400);
    } catch (e: unknown) {
      setReviewMsg(e instanceof Error ? e.message : 'Failed to submit review');
    } finally { setReviewLoading(false); }
  };

  const hasMilestones = (b: Booking) => Array.isArray(b.milestones) && b.milestones.length > 0;

  return (
    <DashboardLayout role="BUYER" title="My Bookings">
      <Card padding="none">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-gray-100">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2 items-center">
            <i className="fa fa-exclamation-circle" />{error}
            <button onClick={() => fetchBookings(tab)} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : bookings.length === 0 && !error
              ? (
                <div className="py-16 text-center">
                  <i className="fa fa-calendar-o text-4xl text-gray-200 mb-3 block" />
                  <p className="text-gray-400 text-sm">No {tab} bookings</p>
                </div>
              )
              : bookings.map(b => {
                  const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
                  const alreadyReviewed = reviewedIds.has(b.id);
                  const milestoned = hasMilestones(b);
                  const submittedMilestones = milestoned ? b.milestones.filter(m => m.status === 'submitted').length : 0;
                  const approvedMilestones  = milestoned ? b.milestones.filter(m => m.status === 'approved').length : 0;
                  const releasedAmount = milestoned ? b.milestones.filter(m => m.status === 'approved').reduce((s, m) => s + Number(m.amount), 0) : 0;
                  return (
                    <div key={b.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar name={b.seller?.name || 'Seller'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Seller: {b.seller?.name || '-'} &nbsp;&middot;&nbsp; {formatTimeAgo(b.createdAt)}
                          </p>
                          {milestoned && (
                            <p className="text-xs mt-0.5">
                              <span className="text-blue-600">
                                <i className="fa fa-flag-checkered mr-1" />
                                Released {formatCurrency(releasedAmount)} of {formatCurrency(Number(b.amount))} ({approvedMilestones}/{b.milestones.length})
                              </span>
                              {submittedMilestones > 0 && <span className="text-purple-600 ml-2"><i className="fa fa-clock-o mr-1" />{submittedMilestones} awaiting your review</span>}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm">{formatBookingAmount(b).primary}</p>
                          <p className="text-xs text-gray-400">
                            {b.job_type === 'hourly' ? formatBookingAmount(b).subtitle : `incl. ${formatCurrency(Number(b.platform_fee))} fee`}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {b.seller?.id && <MessageButton recipientId={b.seller.id} role="buyer" />}
                          {b.status === 'amidst_completion' && !milestoned && (
                            <>
                              <button onClick={() => acceptWork(b.id)} disabled={acceptingId === b.id}
                                className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-60">
                                {acceptingId === b.id ? 'Processing...' : 'Accept'}
                              </button>
                              <button onClick={() => { setSelected(b); setShowReject(true); }}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-medium">
                                Reject
                              </button>
                            </>
                          )}
                          {['pending','ongoing'].includes(b.status) && (
                            <button onClick={() => { setSelected(b); setShowCancel(true); }}
                              className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition-colors font-medium">
                              Cancel
                            </button>
                          )}
                          {b.status === 'completed' && !alreadyReviewed && (
                            <button onClick={() => { setReviewTarget(b); setReviewRating(0); setReviewComment(''); setReviewMsg(''); }}
                              className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-lg hover:bg-yellow-100 transition-colors font-medium">
                              <i className="fa fa-star mr-1" />Leave Review
                            </button>
                          )}
                          {b.status === 'completed' && alreadyReviewed && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <i className="fa fa-check-circle" />Reviewed
                            </span>
                          )}
                          <button onClick={() => router.push(`/buyer/bookings/${b.id}`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <i className="fa fa-eye text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
          }
        </div>
      </Card>

      {/* Leave Review Modal */}
      {reviewTarget && (
        <Modal isOpen onClose={() => setReviewTarget(null)} title="Leave a Review" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <Avatar name={reviewTarget.seller?.name || 'S'} size="sm" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{reviewTarget.seller?.name}</p>
                <p className="text-xs text-gray-400 truncate">{reviewTarget.title}</p>
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
                onChange={e => setReviewComment(e.target.value)}
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
              <button onClick={() => setReviewTarget(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel confirm */}
      {selected && showCancel && (
        <Modal isOpen onClose={() => { setShowCancel(false); setReason(''); }} title="Cancel Booking" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Are you sure you want to cancel <strong>{selected.title}</strong>?</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Reason for cancellation (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545]" />
            {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('cancel') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setShowCancel(false); setReason(''); }}>Back</Button>
              <Button variant="primary" fullWidth disabled={acting}
                onClick={() => doAction(() => buyerBookingApi.cancel(selected.id, reason || undefined), 'Booking cancelled')}>
                {acting ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject confirm (whole booking) */}
      {selected && showReject && (
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
                onClick={() => doAction(() => buyerBookingApi.reject(selected.id, reason || undefined), 'Dispute raised')}>
                {acting ? 'Processing...' : 'Raise Dispute'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </DashboardLayout>
  );
}
