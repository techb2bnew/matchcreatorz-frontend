'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageButton from '@/components/chat/MessageButton';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { buyerBookingApi, BookingAttachment } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface BookingUser { id: number; name: string; }
interface Milestone {
  id: number;
  title: string;
  amount: string;
  duration_days: number | null;
  position: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  attachments: BookingAttachment[];
  notes: string | null;
}
interface Booking {
  id: number;
  title: string;
  amount: string;
  platform_fee: string;
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

const MILESTONE_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Not submitted', color: 'bg-gray-100 text-gray-500'   },
  submitted: { label: 'Awaiting you',  color: 'bg-purple-100 text-purple-700' },
  approved:  { label: 'Paid',          color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',      color: 'bg-red-100 text-red-700'     },
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

  const hasMilestones = (b: Booking) => Array.isArray(b.milestones) && b.milestones.length > 0;

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
                    { label: 'Amount',       value: formatCurrency(Number(booking.amount)),      highlight: true },
                    { label: 'Platform Fee', value: formatCurrency(Number(booking.platform_fee))               },
                    { label: 'Delivery',     value: booking.delivery_days ? `${booking.delivery_days} days` : '-' },
                  ].map(i => (
                    <div key={i.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400">{i.label}</p>
                      <p className={`font-semibold text-sm mt-0.5 ${i.highlight ? 'text-[#e84545]' : 'text-gray-800'}`}>{i.value}</p>
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
                        {m.status === 'submitted' && (
                          <div className="flex gap-2 mt-2.5">
                            <Button variant="primary" fullWidth disabled={milestoneActing}
                              onClick={() => acceptMilestone(m.id)}>
                              {milestoneActing ? 'Processing...' : 'Accept & Pay'}
                            </Button>
                            <Button variant="outline" fullWidth className="text-red-600 border-red-200" disabled={milestoneActing}
                              onClick={() => { setRejectMilestoneId(m.id); setMilestoneReason(''); }}>
                              Reject
                            </Button>
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
                {booking.seller?.id && <MessageButton recipientId={booking.seller.id} role="buyer" />}

                {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}

                {booking.status === 'amidst_completion' && !hasMilestones(booking) && (
                  <>
                    <Button variant="primary" fullWidth disabled={acting}
                      onClick={() => doAction(() => buyerBookingApi.accept(booking.id), 'Work accepted — payment released!')}>
                      {acting ? 'Processing...' : 'Accept & Pay'}
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

                {!['amidst_completion', 'pending', 'ongoing'].includes(booking.status) && (
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
    </DashboardLayout>
  );
}
