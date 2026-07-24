'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageButton from '@/components/chat/MessageButton';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';
import { sellerBookingApi } from '@/lib/adminApi';

interface BookingUser { id: number; name: string; }
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
  createdAt: string;
  buyer: BookingUser | null;
  seller: BookingUser | null;
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
  const [tab,       setTab]       = useState('active');
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState<Booking | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [acting,    setActing]    = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason,    setReason]    = useState('');

  const fetchBookings = useCallback(async (t: string) => {
    setLoading(true); setError('');
    try {
      const res = await sellerBookingApi.list({ tab: t });
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
      setTimeout(() => { setSelected(null); setActionMsg(''); setShowCancel(false); setReason(''); fetchBookings(tab); }, 1200);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally { setActing(false); }
  };

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
                  return (
                    <div key={b.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar name={b.buyer?.name || 'Buyer'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Buyer: {b.buyer?.name || '-'} &middot; {formatTimeAgo(b.createdAt)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(Number(b.amount))}</p>
                          <p className="text-xs text-gray-400">fee: {formatCurrency(Number(b.platform_fee))}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {b.buyer?.id && <MessageButton recipientId={b.buyer.id} role="seller" />}
                          {b.status === 'pending' && (
                            <button onClick={() => doAction(() => sellerBookingApi.accept(b.id), 'Order accepted!')}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 font-medium">
                              Accept
                            </button>
                          )}
                          {b.status === 'ongoing' && (
                            <button onClick={() => doAction(() => sellerBookingApi.submit(b.id), 'Work submitted!')}
                              className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 font-medium">
                              Submit Work
                            </button>
                          )}
                          {b.status === 'pending' && (
                            <button onClick={() => { setSelected(b); setShowCancel(true); }}
                              className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 font-medium">
                              Decline
                            </button>
                          )}
                          <button onClick={() => { setSelected(b); setShowCancel(false); }}
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

      {/* Detail modal */}
      {selected && !showCancel && (
        <Modal isOpen onClose={() => setSelected(null)} title="Booking Details" size="md">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{selected.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={selected.buyer?.name || 'Buyer'} size="xs" />
                  <span className="text-sm text-gray-500">{selected.buyer?.name}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CFG[selected.status]?.color}`}>
                {STATUS_CFG[selected.status]?.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Amount',       value: formatCurrency(Number(selected.amount)),      highlight: true },
                { label: 'Platform Fee', value: formatCurrency(Number(selected.platform_fee))               },
                { label: 'Delivery',     value: selected.delivery_days ? `${selected.delivery_days} days` : '-' },
              ].map(i => (
                <div key={i.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{i.label}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${i.highlight ? 'text-[#e84545]' : 'text-gray-800'}`}>{i.value}</p>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buyer Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
              </div>
            )}
            {selected.dispute_reason && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Dispute Reason</p>
                <p className="text-sm text-gray-700 bg-red-50 rounded-xl p-3">{selected.dispute_reason}</p>
              </div>
            )}
            {actionMsg && <p className={`text-sm text-center font-medium ${actionMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{actionMsg}</p>}
            {selected.status === 'pending' && (
              <div className="flex gap-2">
                <Button variant="primary" fullWidth disabled={acting}
                  onClick={() => doAction(() => sellerBookingApi.accept(selected.id), 'Order accepted!')}>
                  {acting ? 'Processing...' : 'Accept Order'}
                </Button>
                <Button variant="outline" fullWidth className="text-red-600 border-red-200"
                  onClick={() => setShowCancel(true)}>
                  Decline
                </Button>
              </div>
            )}
            {selected.status === 'ongoing' && (
              <Button variant="primary" fullWidth disabled={acting}
                onClick={() => doAction(() => sellerBookingApi.submit(selected.id), 'Work submitted for review!')}>
                {acting ? 'Submitting...' : 'Submit Work for Review'}
              </Button>
            )}
          </div>
        </Modal>
      )}

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
