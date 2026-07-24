'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MessageButton from '@/components/chat/MessageButton';
import { formatCurrency } from '@/lib/utils';
import { buyerJobApi } from '@/lib/adminApi';

interface Seller { id: number; name: string; email: string; }
interface Bid {
  id: number;
  seller_id: number;
  amount: string;
  delivery_days: number;
  proposal: string | null;
  status: 'pending' | 'countered' | 'accepted' | 'rejected';
  counter_amount: string | null;
  counter_delivery_days: number | null;
  counter_by: 'buyer' | 'seller' | null;
  counter_note: string | null;
  createdAt: string;
  seller: Seller | null;
}
interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  bids_count: number;
  created_at: string;
}

const BID_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700' },
  countered: { label: 'Negotiating', color: 'bg-blue-100 text-blue-700'  },
  accepted:  { label: 'Accepted',  color: 'bg-green-100 text-green-700'  },
  rejected:  { label: 'Rejected',  color: 'bg-gray-100 text-gray-500'    },
};

export default function JobDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [job,      setJob]      = useState<Job | null>(null);
  const [bids,     setBids]     = useState<Bid[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Accept modal
  const [acceptTarget,   setAcceptTarget]   = useState<Bid | null>(null);
  const [accepting,      setAccepting]      = useState(false);
  const [actionMsg,      setActionMsg]      = useState('');

  // Reject modal
  const [rejectTarget,   setRejectTarget]   = useState<Bid | null>(null);
  const [rejecting,      setRejecting]      = useState(false);

  // Counter modal
  const [counterTarget, setCounterTarget] = useState<Bid | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterDays,   setCounterDays]   = useState('');
  const [counterNote,   setCounterNote]   = useState('');
  const [countering,    setCountering]    = useState(false);

  const reload = async () => {
    const res = await buyerJobApi.getBids(Number(id));
    setJob(res.job);
    setBids(res.data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError('');
      try {
        await reload();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally { setLoading(false); }
    };
    if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openCounter = (bid: Bid) => {
    setCounterTarget(bid);
    setCounterAmount(bid.counter_amount ?? bid.amount);
    setCounterDays(String(bid.counter_delivery_days ?? bid.delivery_days));
    setCounterNote('');
    setActionMsg('');
  };

  const handleCounter = async () => {
    if (!counterTarget) return;
    if (!counterAmount || Number(counterAmount) <= 0) { setActionMsg('Enter a valid amount'); return; }
    setCountering(true); setActionMsg('');
    try {
      await buyerJobApi.counterBid(Number(id), counterTarget.id, {
        amount:        Number(counterAmount),
        delivery_days: counterDays ? Number(counterDays) : undefined,
        note:          counterNote || undefined,
      });
      await reload();
      setCounterTarget(null);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Failed to send counter');
    } finally { setCountering(false); }
  };

  const handleAccept = async () => {
    if (!acceptTarget) return;
    setAccepting(true); setActionMsg('');
    try {
      await buyerJobApi.acceptBid(Number(id), acceptTarget.id);
      setActionMsg('Bid accepted! Booking created.');
      setTimeout(() => {
        setAcceptTarget(null);
        setActionMsg('');
        router.push('/buyer/bookings');
      }, 1500);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Failed to accept bid');
    } finally { setAccepting(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true); setActionMsg('');
    try {
      await buyerJobApi.rejectBid(Number(id), rejectTarget.id);
      setBids(prev => prev.map(b => b.id === rejectTarget.id ? { ...b, status: 'rejected' } : b));
      setRejectTarget(null);
      setActionMsg('');
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Failed to reject bid');
    } finally { setRejecting(false); }
  };

  const jobAlreadyAccepted = bids.some(b => b.status === 'accepted');

  return (
    <DashboardLayout role="BUYER" title="Job Bids">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e84545] mb-5 transition-colors">
        <i className="fa fa-arrow-left text-xs" /> Back to Jobs
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fa fa-spinner fa-spin text-2xl text-[#e84545]" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          <i className="fa fa-exclamation-circle mr-2" />{error}
        </div>
      ) : (
        <>
          {/* Job summary card */}
          {job && (
            <Card padding="md" className="mb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{job.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{job.category}</p>
                  {job.description && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-3">{job.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="font-bold text-[#e84545]">
                    {job.budget_min || job.budget_max
                      ? `${formatCurrency(job.budget_min || 0)} - ${formatCurrency(job.budget_max || 0)}`
                      : 'Not set'}
                  </p>
                  <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{job.status}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Bids header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'} Received
            </h3>
            {jobAlreadyAccepted && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                <i className="fa fa-check-circle mr-1" />Bid Accepted
              </span>
            )}
          </div>

          {bids.length === 0 ? (
            <Card padding="md">
              <div className="py-10 text-center">
                <i className="fa fa-gavel text-4xl text-gray-200 mb-3 block" />
                <p className="text-gray-400 text-sm">No bids yet on this job</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {bids.map(bid => {
                const cfg = BID_STATUS[bid.status] || BID_STATUS.pending;
                const isAccepted = bid.status === 'accepted';
                const isRejected = bid.status === 'rejected';
                const canAct = ['pending', 'countered'].includes(bid.status) && !jobAlreadyAccepted && job?.status === 'OPEN';
                const hasCounter = bid.counter_amount != null;
                const waitingOnSeller = bid.status === 'countered' && bid.counter_by === 'buyer';
                return (
                  <Card key={bid.id} padding="md" className={
                    isAccepted ? 'border-green-300 bg-green-50' :
                    isRejected ? 'opacity-60' : ''
                  }>
                    <div className="flex items-start gap-4">
                      <Avatar name={bid.seller?.name || 'S'} size="md" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{bid.seller?.name || 'Seller'}</p>
                            <p className="text-xs text-gray-400">{bid.seller?.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {bid.seller?.id && <MessageButton recipientId={bid.seller.id} role="buyer" />}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 mt-3">
                          <div>
                            <p className="text-xs text-gray-400">Bid Amount</p>
                            <p className="font-bold text-[#e84545] text-base">{formatCurrency(Number(bid.amount))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Delivery</p>
                            <p className="font-semibold text-gray-700 text-sm">{bid.delivery_days} days</p>
                          </div>
                        </div>

                        {bid.proposal && (
                          <div className="mt-3 bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Proposal</p>
                            <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: bid.proposal }} />
                          </div>
                        )}

                        {/* Current counter on the table */}
                        {hasCounter && (
                          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                              <i className="fa fa-exchange mr-1" />
                              {bid.counter_by === 'buyer' ? 'Your counter (awaiting seller)' : 'Seller countered'}
                            </p>
                            <div className="flex items-center gap-5">
                              <div>
                                <p className="text-xs text-gray-400">Amount</p>
                                <p className="font-bold text-blue-700">{formatCurrency(Number(bid.counter_amount))}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Delivery</p>
                                <p className="font-semibold text-gray-700 text-sm">{bid.counter_delivery_days ?? bid.delivery_days} days</p>
                              </div>
                            </div>
                            {bid.counter_note && <p className="text-xs text-gray-500 mt-1.5">{bid.counter_note}</p>}
                          </div>
                        )}

                        {/* Action buttons */}
                        {canAct && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {waitingOnSeller ? (
                              <span className="text-xs text-blue-600 font-medium py-2">
                                <i className="fa fa-clock-o mr-1" /> Waiting for seller to respond to your counter
                              </span>
                            ) : (
                              <button
                                onClick={() => setAcceptTarget(bid)}
                                className="px-5 py-2 bg-[#e84545] text-white text-sm font-semibold rounded-xl hover:bg-[#c73333] transition-colors"
                              >
                                <i className="fa fa-check mr-2" />Accept{hasCounter ? ' Counter' : ''}
                              </button>
                            )}
                            <button
                              onClick={() => openCounter(bid)}
                              className="px-5 py-2 bg-white text-blue-600 text-sm font-semibold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors"
                            >
                              <i className="fa fa-exchange mr-2" />Counter
                            </button>
                            <button
                              onClick={() => setRejectTarget(bid)}
                              className="px-5 py-2 bg-white text-gray-600 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            >
                              <i className="fa fa-times mr-2" />Reject
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium">
                            <i className="fa fa-check-circle" />
                            Accepted -- Booking created
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Accept confirm modal */}
      {acceptTarget && (
        <Modal isOpen onClose={() => { setAcceptTarget(null); setActionMsg(''); }} title="Accept Bid" size="sm">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={acceptTarget.seller?.name || 'S'} size="sm" />
                <div>
                  <p className="font-semibold text-gray-900">{acceptTarget.seller?.name}</p>
                  <p className="text-xs text-gray-400">{acceptTarget.seller?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="font-bold text-[#e84545]">{formatCurrency(Number(acceptTarget.counter_amount ?? acceptTarget.amount))}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-400">Delivery</p>
                  <p className="font-bold text-gray-800">{acceptTarget.counter_amount != null ? (acceptTarget.counter_delivery_days ?? acceptTarget.delivery_days) : acceptTarget.delivery_days} days</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">Accepting this bid will:</p>
            <ul className="text-sm text-gray-600 space-y-1 pl-4">
              <li className="list-disc">Create a booking automatically</li>
              <li className="list-disc">Reject all other bids on this job</li>
              <li className="list-disc">Mark this job as In Progress</li>
            </ul>

            {actionMsg && (
              <p className={`text-sm text-center font-medium ${actionMsg.includes('created') ? 'text-green-600' : 'text-red-600'}`}>
                {actionMsg}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setAcceptTarget(null); setActionMsg(''); }}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth disabled={accepting} onClick={handleAccept}>
                {accepting ? 'Processing...' : 'Confirm Accept'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Counter offer modal */}
      {counterTarget && (
        <Modal isOpen onClose={() => setCounterTarget(null)} title="Counter Offer" size="sm">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <Avatar name={counterTarget.seller?.name || 'S'} size="sm" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{counterTarget.seller?.name}</p>
                <p className="text-xs text-gray-400">
                  Current: {formatCurrency(Number(counterTarget.counter_amount ?? counterTarget.amount))} &middot; {counterTarget.counter_delivery_days ?? counterTarget.delivery_days} days
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your Amount ($)</label>
                <input type="number" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Delivery (days)</label>
                <input type="number" value={counterDays} onChange={(e) => setCounterDays(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-[#e84545]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note (optional)</label>
              <textarea rows={2} value={counterNote} onChange={(e) => setCounterNote(e.target.value)}
                placeholder="Add a note for the seller..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#e84545]" />
            </div>

            {actionMsg && <p className="text-sm text-center text-red-600 font-medium">{actionMsg}</p>}

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setCounterTarget(null)}>Cancel</Button>
              <Button variant="primary" fullWidth disabled={countering} onClick={handleCounter}>
                {countering ? 'Sending...' : 'Send Counter'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject confirm modal */}
      {rejectTarget && (
        <Modal isOpen onClose={() => { setRejectTarget(null); setActionMsg(''); }} title="Reject Bid" size="sm">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
              <Avatar name={rejectTarget.seller?.name || 'S'} size="sm" />
              <div>
                <p className="font-semibold text-gray-900">{rejectTarget.seller?.name}</p>
                <p className="text-xs text-gray-400">{formatCurrency(Number(rejectTarget.amount))} &middot; {rejectTarget.delivery_days} days</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to reject this bid? The seller will be notified.
            </p>

            {actionMsg && (
              <p className="text-sm text-center text-red-600 font-medium">{actionMsg}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                disabled={rejecting}
                onClick={handleReject}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {rejecting ? 'Rejecting...' : 'Yes, Reject Bid'}
              </button>
              <button
                onClick={() => { setRejectTarget(null); setActionMsg(''); }}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
