'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card            from '@/components/ui/Card';
import Button          from '@/components/ui/Button';
import Modal           from '@/components/ui/Modal';
import { Spinner, TableSkeleton } from '@/components/ui/Loader';
import { formatDate, formatCurrency } from '@/lib/utils';
import { adminJobApi } from '@/lib/adminApi';

interface BidRow {
  id: number;
  amount: number;
  status: string;
  message: string;
  seller?: { id: number; name: string; email: string };
}

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  job_type: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  skills: string[];
  experience_level: string;
  status: string;
  bids_count: number;
  created_at: string;
  buyer?: { id: number; name: string; email: string };
  bids?: BidRow[];
}

const statusBadge = (s: string) => {
  if (s === 'OPEN')        return 'bg-green-100 text-green-700';
  if (s === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
  if (s === 'CLOSED')      return 'bg-gray-100 text-gray-500';
  if (s === 'CANCELLED')   return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
};

const statusLabel = (s: string) => {
  if (s === 'OPEN')        return 'Open';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'CLOSED')      return 'Closed';
  if (s === 'CANCELLED')   return 'Cancelled';
  return s;
};

// ── Job Detail Modal ─────────────────────────────────────────────────
function JobDetailModal({
  job, onClose, onClose_job, onDelete, actionLoading,
}: {
  job: Job | null;
  onClose: () => void;
  onClose_job: (id: number) => void;
  onDelete: (job: Job) => void;
  actionLoading: string;
}) {
  if (!job) return null;

  return (
    <Modal isOpen={!!job} onClose={onClose} title="" size="md" noPadding>
      <div className="flex flex-col overflow-hidden rounded-2xl" style={{ maxHeight: '88vh' }}>
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4" style={{ scrollbarWidth: 'none' }}>

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${statusBadge(job.status)}`}>
                {statusLabel(job.status)}
              </span>
              <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
            </div>
            <div className="text-xs text-gray-400 text-right whitespace-nowrap mt-1">
              #{job.id}<br />{formatDate(job.created_at)}
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Budget / Type / Deadline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#e84545]/5 border border-[#e84545]/10 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Budget</p>
              <p className="text-sm font-bold text-[#e84545]">
                {job.budget_min && job.budget_max
                  ? `$${Number(job.budget_min).toLocaleString()} – $${Number(job.budget_max).toLocaleString()}`
                  : 'Flexible'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Type</p>
              <p className="text-sm font-bold text-gray-900 capitalize">{job.job_type}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Deadline</p>
              <p className="text-sm font-bold text-gray-900">{job.deadline || 'N/A'}</p>
            </div>
          </div>

          {/* Buyer + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Posted By</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#e84545] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {job.buyer?.name?.[0]?.toUpperCase() || 'B'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{job.buyer?.name || '--'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{job.buyer?.email || ''}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Category</p>
              <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
                {job.category}
              </span>
              <p className="text-xs text-gray-400 mt-1 capitalize">Level: {job.experience_level}</p>
            </div>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map(sk => (
                  <span key={sk} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium">{sk}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bids */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
              Bids ({job.bids?.length || job.bids_count || 0})
            </p>
            {(job.bids || []).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No bids yet</p>
            ) : (
              <div className="space-y-2">
                {(job.bids || []).map(b => (
                  <div key={b.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                      {b.seller?.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{b.seller?.name || '--'}</p>
                      {b.message && <p className="text-[10px] text-gray-400 truncate">{b.message}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#e84545]">{formatCurrency(b.amount)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      b.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      b.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 bg-white">
          {job.status === 'OPEN' && (
            <Button size="sm" variant="outline"
              onClick={() => onClose_job(job.id)}
              loading={actionLoading === `close-${job.id}`}
              leftIcon={<i className="fa fa-times-circle text-xs" />}
            >Close Job</Button>
          )}
          <button onClick={() => onDelete(job)}
            className="ml-auto px-3 py-1.5 rounded-xl border border-red-200 text-red-500 text-xs hover:bg-red-50 transition flex items-center gap-1.5"
          >
            {actionLoading === `delete-${job.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-trash" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AdminJobsPage() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const LIMIT = 10;

  const [viewJob,       setViewJob]       = useState<Job | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [deleteTarget,  setDeleteTarget]  = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await adminJobApi.list(params);
      setJobs(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 350);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  const openDetail = async (job: Job) => {
    try {
      const res = await adminJobApi.get(job.id);
      setViewJob(res.data);
    } catch {
      setViewJob(job);
    }
  };

  const doClose = async (id: number) => {
    setActionLoading(`close-${id}`);
    try {
      await adminJobApi.close(id);
      await fetchJobs();
      setViewJob(null);
    } catch { /* ignore */ }
    finally { setActionLoading(''); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(`delete-${deleteTarget.id}`);
    try {
      await adminJobApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      setViewJob(null);
      await fetchJobs();
    } catch { /* ignore */ }
    finally { setActionLoading(''); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <DashboardLayout role="ADMIN" title="Jobs">
      <Card padding="none">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" placeholder="Search jobs or buyer..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e84545]"
            />
          </div>

          {/* Status filters */}
          <div className="ml-auto flex gap-1.5 flex-wrap">
            {[
              { label: 'All',         value: '' },
              { label: 'Open',        value: 'OPEN' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Closed',      value: 'CLOSED' },
              { label: 'Cancelled',   value: 'CANCELLED' },
            ].map(f => (
              <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  status === f.value ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={6} /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fa fa-briefcase text-3xl mb-2 block" />
              <p className="text-sm">No jobs found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Job Title', 'Buyer', 'Budget', 'Bids', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <i className="fa fa-briefcase text-amber-500 text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{j.title}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{j.category} · {j.job_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 text-xs font-medium">{j.buyer?.name || '--'}</p>
                      <p className="text-[10px] text-gray-400">{j.buyer?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {j.budget_min && j.budget_max
                        ? `$${Number(j.budget_min).toLocaleString()} – $${Number(j.budget_max).toLocaleString()}`
                        : <span className="text-gray-400">Flexible</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                        <i className="fa fa-gavel text-gray-400 text-[10px]" />{j.bids_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusBadge(j.status)}`}>
                        {statusLabel(j.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(j)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                          <i className="fa fa-eye text-sm" />
                        </button>
                        {j.status === 'OPEN' && (
                          <button onClick={() => doClose(j.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Close Job">
                            {actionLoading === `close-${j.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-times-circle text-sm" />}
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(j)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                          {actionLoading === `delete-${j.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-trash text-sm" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} jobs
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-8 w-8 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">&lt;</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-8 w-8 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">&gt;</button>
            </div>
          </div>
        )}
      </Card>

      <JobDetailModal
        job={viewJob}
        onClose={() => setViewJob(null)}
        onClose_job={doClose}
        onDelete={j => { setDeleteTarget(j); setViewJob(null); }}
        actionLoading={actionLoading}
      />

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Job" size="sm">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fa fa-trash text-2xl text-red-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 mb-1">Are you sure?</p>
            <p className="text-sm text-gray-500">
              Delete <strong>&quot;{deleteTarget?.title}&quot;</strong>? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)} disabled={actionLoading.startsWith('delete-')}>Cancel</Button>
          <Button variant="danger"  fullWidth onClick={confirmDelete}               loading={actionLoading.startsWith('delete-')}>Yes, Delete</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
