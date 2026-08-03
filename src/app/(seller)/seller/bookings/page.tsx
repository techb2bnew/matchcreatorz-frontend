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
import { sellerBookingApi, BookingAttachment } from '@/lib/adminApi';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface BookingUser { id: number; name: string; }
interface Milestone {
  id: number;
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
  buyer: BookingUser | null;
  seller: BookingUser | null;
  milestones: Milestone[];
}

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:           { label: 'Pending',       color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  ongoing:           { label: 'Ongoing',       color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  amidst_completion: { label: 'Under Review',  color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  completed:         { label: 'Completed',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  cancelled:         { label: 'Cancelled',     color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400'   },
  in_dispute:        { label: 'In Dispute',    color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
};

const TABS = ['active', 'completed', 'cancelled'];

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

export default function SellerBookingsPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState('active');
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState<Booking | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [acting,    setActing]    = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason,    setReason]    = useState('');

  const fetchBookings = useCallback(async (t: string, silent = false) => {
    if (!silent) { setLoading(true); setError(''); }
    try {
      const res = await sellerBookingApi.list({ tab: t });
      setBookings(res.data || []);
    } catch (e: unknown) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load bookings');
      else console.error('Silent bookings refresh failed:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(tab); }, [tab, fetchBookings]);

  // Pause while the decline/cancel confirmation modal is open.
  useAutoRefresh(() => fetchBookings(tab, true), 20000, !showCancel);

  const doAction = async (action: () => Promise<unknown>, msg: string) => {
    setActing(true); setActionMsg('');
    try {
      await action();
      setActionMsg(msg);
      setTimeout(() => { setSelected(null); setActionMsg(''); setShowCancel(false); setReason(''); fetchBookings(tab); }, 1200);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally { setActing(false); }
  };

  const hasMilestones = (b: Booking) => Array.isArray(b.milestones) && b.milestones.length > 0;

  return (
    <DashboardLayout role="SELLER" title="My Bookings">
      <Card padding="none">
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
                  const milestoned = hasMilestones(b);
                  const approvedCount = milestoned ? b.milestones.filter(m => m.status === 'approved').length : 0;
                  return (
                    <div key={b.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar name={b.buyer?.name || 'Buyer'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Buyer: {b.buyer?.name || '-'} &middot; {formatTimeAgo(b.createdAt)}
                          </p>
                          {milestoned && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              <i className="fa fa-flag-checkered mr-1" />{approvedCount}/{b.milestones.length} milestones paid
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm">{formatBookingAmount(b).primary}</p>
                          <p className="text-xs text-gray-400">
                            {b.job_type === 'hourly' ? formatBookingAmount(b).subtitle : `fee: ${formatCurrency(Number(b.platform_fee))}`}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {b.buyer?.id && <MessageButton recipientId={b.buyer.id} role="seller" label="Chat with Buyer" />}
                          {b.status === 'pending' && (
                            <button onClick={() => doAction(() => sellerBookingApi.accept(b.id), 'Order accepted!')}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 font-medium">
                              Accept
                            </button>
                          )}
                          {b.status === 'pending' && (
                            <button onClick={() => { setSelected(b); setShowCancel(true); }}
                              className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 font-medium">
                              Decline
                            </button>
                          )}
                          {b.status === 'in_dispute' && !milestoned && (
                            <a href="/seller/support"
                              className="px-3 py-1.5 border border-amber-300 text-amber-700 text-xs rounded-lg hover:bg-amber-50 font-medium">
                              Chat with Support
                            </a>
                          )}
                          <button onClick={() => router.push(`/seller/bookings/${b.id}`)}
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

      {/* Decline/cancel confirm */}
      {selected && showCancel && (
        <Modal isOpen onClose={() => { setShowCancel(false); setReason(''); }} title="Decline Order" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Decline booking: <strong>{selected.title}</strong>?</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Reason for declining (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#e84545]" />
            {actionMsg && <p className="text-sm text-center font-medium text-red-600">{actionMsg}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setShowCancel(false); setReason(''); }}>Back</Button>
              <Button variant="primary" fullWidth disabled={acting}
                onClick={() => doAction(() => sellerBookingApi.cancel(selected.id, reason || undefined), 'Order declined')}>
                {acting ? 'Processing...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
