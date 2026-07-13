'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatTimeAgo } from '@/lib/utils';
import { adminReviewApi } from '@/lib/adminApi';

interface ReviewUser { id: number; name: string; email: string; }
interface Review {
  id: number;
  rating: number;
  comment: string | null;
  status: 'published' | 'hidden';
  created_at: string;
  buyer:   ReviewUser | null;
  seller:  ReviewUser | null;
  service: { id: number; title: string } | null;
  booking: { id: number; title: string } | null;
}
interface Summary { total: number; published: number; hidden: number; }

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Published',    value: 'published' },
  { label: 'Hidden',       value: 'hidden' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <i key={i} className={`${i <= rating ? 'fa fa-star text-yellow-400' : 'fa fa-star-o text-gray-300'} text-xs`} />
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6].map(i => <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>)}
    </tr>
  );
}

export default function AdminReviewsPage() {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [summary,    setSummary]    = useState<Summary>({ total: 0, published: 0, hidden: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminReviewApi.list({ search: search || undefined, status: status || undefined, limit: 50 });
      setReviews(res.data || []);
      setSummary(res.summary || { total: 0, published: 0, hidden: 0 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetch, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetch]);

  const toggleStatus = async (r: Review) => {
    try {
      if (r.status === 'published') await adminReviewApi.hide(r.id);
      else                          await adminReviewApi.publish(r.id);
      fetch();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    try { await adminReviewApi.delete(id); fetch(); } catch { /* ignore */ }
  };

  return (
    <DashboardLayout role="ADMIN" title="Reviews">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Reviews', value: summary.total,     icon: 'fa-star',       color: 'text-blue-600 bg-blue-50'   },
          { label: 'Published',     value: summary.published, icon: 'fa-check-circle',color: 'text-green-600 bg-green-50' },
          { label: 'Hidden',        value: summary.hidden,    icon: 'fa-eye-slash',  color: 'text-gray-600 bg-gray-100'  },
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
            <input type="text" placeholder="Search by comment..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none" />
          </div>
          <div className="w-44">
            <CustomSelect
              value={STATUS_OPTIONS.find(o => o.value === status)?.label || 'All Statuses'}
              onChange={(label) => {
                const found = STATUS_OPTIONS.find(o => o.label === label);
                if (found) setStatus(found.value);
              }}
              options={STATUS_OPTIONS.map(o => o.label)}
            />
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <i className="fa fa-exclamation-circle mr-2" />{error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Reviewer', 'Seller', 'Service', 'Rating', 'Comment', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : reviews.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-400 text-sm">
                        <i className="fa fa-star text-3xl mb-3 block text-gray-200" />
                        No reviews found
                      </td>
                    </tr>
                  )
                  : reviews.map(r => (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.status === 'hidden' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">#{r.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.buyer?.name || 'B'} size="xs" />
                          <span className="text-gray-700 text-xs">{r.buyer?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.seller?.name || 'S'} size="xs" />
                          <span className="text-gray-700 text-xs">{r.seller?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                        {r.service?.title
                          ? <span title={r.service.title}>{r.service.title}</span>
                          : r.booking?.title
                            ? <span className="italic text-gray-400" title={r.booking.title}>{r.booking.title}</span>
                            : '-'}
                      </td>
                      <td className="px-4 py-3"><StarRow rating={r.rating} /></td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-gray-600 truncate">{r.comment || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'published' ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatTimeAgo(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleStatus(r)}
                            title={r.status === 'published' ? 'Hide' : 'Publish'}
                            className={`p-1.5 rounded-lg transition-colors ${r.status === 'published' ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                            <i className={`fa ${r.status === 'published' ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                          </button>
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <i className="fa fa-trash text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
