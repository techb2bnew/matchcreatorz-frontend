'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { adminNewsletterApi, AdminNewsletterSubscriber } from '@/lib/adminApi';
import { TableSkeleton } from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export default function NewsletterPage() {
  const [subs, setSubs]       = useState<AdminNewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const [deleteSub, setDeleteSub] = useState<AdminNewsletterSubscriber | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSubs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: { page: number; limit: number; search?: string } = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      const json = await adminNewsletterApi.list(params);
      setSubs(json.data || []);
      setTotal(json.meta?.total || 0);
      setTotalPages(json.meta?.totalPages || json.pagination?.pages || 1);
    } catch (err: any) {
      if (!silent) toast.error(err.message || 'Failed to fetch subscribers');
      else console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  useAutoRefresh(() => fetchSubs(true), 20000, !deleteSub);

  const handleDelete = async () => {
    if (!deleteSub) return;
    setDeleteLoading(true);
    try {
      await adminNewsletterApi.delete(deleteSub.id);
      toast.success('Subscriber removed');
      setDeleteSub(null);
      fetchSubs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove subscriber');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Newsletter">

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Newsletter Subscribers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Emails collected from the public &quot;Join Our Newsletter&quot; form</p>
        </div>
        <div className="w-full sm:flex-1 sm:max-w-xs sm:ml-auto">
          <Input
            placeholder="Search by email..."
            leftIcon={<i className="fa fa-search text-gray-400 text-sm" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <CardTitle>Subscribers</CardTitle>
          <span className="text-xs text-gray-400">{total} total</span>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : subs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <i className="fa fa-envelope-o text-4xl mb-3 block" />
            <p className="font-medium">No subscribers yet</p>
            {debouncedSearch && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Subscribed</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(s.createdAt || s.created_at || '')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteSub(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <i className="fa fa-trash text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <i className="fa fa-chevron-left text-xs" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <i className="fa fa-chevron-right text-xs" />
          </button>
        </div>
      )}

      {/* -- Delete Confirm Modal -- */}
      <Modal isOpen={!!deleteSub} onClose={() => setDeleteSub(null)} title="Remove Subscriber" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remove <strong>{deleteSub?.email}</strong> from the newsletter list?
          </p>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setDeleteSub(null)}>Cancel</Button>
            <Button
              fullWidth
              onClick={handleDelete}
              disabled={deleteLoading}
              className="!bg-red-500 hover:!bg-red-600"
            >
              {deleteLoading ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}
