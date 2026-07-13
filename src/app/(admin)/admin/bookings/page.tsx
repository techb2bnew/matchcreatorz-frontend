'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';
import { adminBookingApi } from '@/lib/adminApi';

interface BookingUser { id: number; name: string; email: string; }
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
interface Pagination { total: number; page: number; limit: number; pages: number; }
interface Summary { [key: string]: number; }

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:           { label: 'Pending',       color: 'bg-yellow-100 text-yellow-700' },
  ongoing:           { label: 'Ongoing',       color: 'bg-blue-100 text-blue-700'    },
  amidst_completion: { label: 'Under Review',  color: 'bg-purple-100 text-purple-700'},
  completed:         { label: 'Completed',     color: 'bg-green-100 text-green-700'  },
  cancelled:         { label: 'Cancelled',     color: 'bg-gray-100 text-gray-500'    },
  in_dispute:        { label: 'In Dispute',    color: 'bg-red-100 text-red-700'      },
};

const STATUS_OPTIONS = [
  { label: 'All Statuses',  value: ''                 },
  { label: 'Pending',       value: 'pending'          },
  { label: 'Ongoing',       value: 'ongoing'          },
  { label: 'Under Review',  value: 'amidst_completion'},
  { label: 'Completed',     value: 'completed'        },
  { label: 'Cancelled',     value: 'cancelled'        },
  { label: 'In Dispute',    value: 'in_dispute'       },
];

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6].map(i => <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
    </tr>
  );
}

export default function AdminBookingsPage() {
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary,    setSummary]    = useState<Summary>({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<Booking | null>(null);
  const [resolving,  setResolving]  = useState(false);
  const [resolveMsg, setResolveMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBookings = useCallback(async (pg = 1) => {
    setLoading(true); setError('');
    try {
      const res = await adminBookingApi.list({ status: status || undefined, search: search || undefined, page: pg, limit: 20 });
      setBookings(res.data || []);
      setPagination(res.pagination || null);
      setSummary(res.summary || {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchBookings(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchBookings]);

  const handleResolve = async (resolution: 'completed' | 'cancelled') => {
    if (!selected) return;
    setResolving(true); setResolveMsg('');
    try {
      await adminBookingApi.resolve(selected.id, resolution);
      setResolveMsg(`Resolved as ${resolution}`);
      setTimeout(() => { setSelected(null); setResolveMsg(''); fetchBookings(page); }, 1200);
    } catch (e: unknown) {
      setResolveMsg(e instanceof Error ? e.message : 'Failed');
    } finally { setResolving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await adminBookingApi.delete(id);
      fetchBookings(page);
    } catch { /* ignore */ }
  };

  const totalBookings = Object.values(summary).reduce((a, b) => a + b, 0);
  const disputed = summary['in_dispute'] || 0;
  const completed = summary['completed'] || 0;

  return (
    <DashboardLayout role="ADMIN" title="Bookings">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',     value: totalBookings, icon: 'fa-calendar',       color: 'text-blue-600 bg-blue-50'   },
          { label: 'Active',    value: (summary['ongoing'] || 0) + (summary['pending'] || 0), icon: 'fa-spinner', color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Completed', value: completed,     icon: 'fa-check-circle',   color: 'text-green-600 bg-green-50' },
          { label: 'Disputes',  value: disputed,      icon: 'fa-exclamation-triangle', color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <Card key={s.label} padding="md">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <i className={`fa ${s.icon} text-base`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="none">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9">
            <i className="fa fa-search text-xs text-gray-400" />
            <input type="text" placeholder="Search bookings..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" />
          </div>
          <div className="w-44">
            <CustomSelect
              value={STATUS_OPTIONS.find(o => o.value === status)?.label || 'All Statuses'}
              onChange={(label) => {
                const found = STATUS_OPTIONS.find(o => o.label === label);
                if (found !== undefined) setStatus(found.value);
              }}
              options={STATUS_OPTIONS.map(o => o.label)}
            />
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex gap-2">
            <i className="fa fa-exclamation-circle" />{error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Title', 'Buyer', 'Seller', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : bookings.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-gray-400 text-sm">
                        <i className="fa fa-calendar-o text-3xl mb-3 block text-gray-200" />
                        No bookings found
                      </td>
                    </tr>
                  )
                  : bookings.map(b => {
                      const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">#{b.id}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{b.title}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={b.buyer?.name || 'B'} size="xs" />
                              <span className="text-gray-600 text-xs">{b.buyer?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={b.seller?.name || 'S'} size="xs" />
                              <span className="text-gray-600 text-xs">{b.seller?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(Number(b.amount))}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{formatTimeAgo(b.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelected(b)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                <i className="fa fa-eye text-xs" />
                              </button>
                              <button onClick={() => handleDelete(b.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <i className="fa fa-trash text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {bookings.length} of {pagination.total} bookings
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => { setPage(p => p - 1); fetchBookings(page - 1); }} disabled={page <= 1}
                className="h-7 w-7 rounded-lg border border-gray-200 text-xs flex items-center justify-center disabled:opacity-40 hover:border-[#e84545] hover:text-[#e84545]">
                &lt;
              </button>
              <span className="text-xs text-gray-500 px-2">{page} / {pagination.pages}</span>
              <button onClick={() => { setPage(p => p + 1); fetchBookings(page + 1); }} disabled={page >= pagination.pages}
                className="h-7 w-7 rounded-lg border border-gray-200 text-xs flex items-center justify-center disabled:opacity-40 hover:border-[#e84545] hover:text-[#e84545]">
                &gt;
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail / resolve modal */}
      {selected && (
        <Modal isOpen onClose={() => { setSelected(null); setResolveMsg(''); }} title={`Booking #${selected.id}`} size="md">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-gray-900">{selected.title}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CFG[selected.status]?.color}`}>
                {STATUS_CFG[selected.status]?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Buyer</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.buyer?.name || 'B'} size="xs" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selected.buyer?.name}</p>
                    <p className="text-xs text-gray-400">{selected.buyer?.email}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Seller</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.seller?.name || 'S'} size="xs" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selected.seller?.name}</p>
                    <p className="text-xs text-gray-400">{selected.seller?.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Amount',   value: formatCurrency(Number(selected.amount)),       highlight: true },
                { label: 'Fee',      value: formatCurrency(Number(selected.platform_fee))               },
                { label: 'Delivery', value: selected.delivery_days ? `${selected.delivery_days}d` : '-' },
              ].map(i => (
                <div key={i.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{i.label}</p>
                  <p className={`font-semibold text-sm mt-0.5 ${i.highlight ? 'text-[#e84545]' : 'text-gray-800'}`}>{i.value}</p>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
              </div>
            )}
            {selected.dispute_reason && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Dispute Reason</p>
                <p className="text-sm text-gray-700 bg-red-50 rounded-xl p-3">{selected.dispute_reason}</p>
              </div>
            )}
            {selected.cancel_reason && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cancel Reason</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.cancel_reason}</p>
              </div>
            )}
            {resolveMsg && <p className={`text-sm text-center font-medium ${resolveMsg.includes('Resolved') ? 'text-green-600' : 'text-red-600'}`}>{resolveMsg}</p>}
            {selected.status === 'in_dispute' && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resolve Dispute</p>
                <div className="flex gap-2">
                  <Button variant="primary" fullWidth disabled={resolving}
                    onClick={() => handleResolve('completed')}>
                    {resolving ? '...' : 'Favour Buyer (Complete)'}
                  </Button>
                  <Button variant="outline" fullWidth disabled={resolving}
                    className="text-red-600 border-red-200"
                    onClick={() => handleResolve('cancelled')}>
                    {resolving ? '...' : 'Refund (Cancel)'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
