'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card            from '@/components/ui/Card';
import Button          from '@/components/ui/Button';
import Modal           from '@/components/ui/Modal';
import { Spinner, TableSkeleton } from '@/components/ui/Loader';
import { formatCurrency }          from '@/lib/utils';
import { adminServiceApi, categoryApi } from '@/lib/adminApi';

type ServiceStatus = 'active' | 'paused' | 'rejected';

// -- Custom single-select category filter ------------------------------
function CategoryFilter({
  categories, value, onChange,
}: {
  categories: { id: number; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = categories.find((c) => String(c.id) === value);
  const label    = selected ? selected.name : 'All Categories';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-sm transition-all whitespace-nowrap ${
          value ? 'border-[#e84545] text-[#e84545] font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <i className="fa fa-tag text-xs" />
        {label}
        <i className={`fa fa-chevron-${open ? 'up' : 'down'} text-[10px] text-gray-400`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 min-w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1">
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!value ? 'bg-[#e84545] text-white font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          >All Categories</button>
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => { onChange(String(c.id)); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${String(c.id) === value ? 'bg-[#e84545] text-white font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
            >{c.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Service {
  id: number; title: string; description: string; price: number;
  delivery_days: number; revisions: number; images: string[]; tags: string[];
  status: ServiceStatus; is_featured: boolean; views_count: number;
  orders_count: number; rating: number; reviews_count: number;
  category?: { id: number; name: string; icon: string };
  seller?: { id: number; name: string; email: string };
  created_at?: string;
}
interface Category { id: number; name: string }

const statusBadge = (s: ServiceStatus) => {
  if (s === 'active')   return 'bg-green-100 text-green-700';
  if (s === 'paused')   return 'bg-yellow-100 text-yellow-700';
  if (s === 'rejected') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
};

// -- Service Detail Modal -----------------------------------------------
function ServiceDetailModal({
  service, onClose, onAction, actionLoading,
}: {
  service: Service | null;
  onClose: () => void;
  onAction: (id: number, action: 'reject' | 'restore' | 'feature' | 'delete') => void;
  actionLoading: string;
}) {
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => { setActiveImg(0); }, [service]);

  if (!service) return null;
  const s    = service;
  const imgs = s.images || [];

  return (
    <Modal isOpen={!!service} onClose={onClose} title="" size="md" noPadding>
      <div className="flex flex-col overflow-hidden rounded-2xl" style={{ maxHeight: '88vh' }}>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none' }}>

          {/* Banner image */}
          {imgs.length > 0 ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgs[activeImg]} alt={s.title} className="w-full h-52 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              <div className="absolute top-3 left-4 flex gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow ${statusBadge(s.status)}`}>{s.status}</span>
                {s.is_featured && (
                  <span className="text-xs text-yellow-900 bg-yellow-400 px-2.5 py-1 rounded-full font-semibold shadow flex items-center gap-1">
                    <i className="fa fa-star text-[10px]" /> Featured
                  </span>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="absolute bottom-3 left-4 flex gap-1.5">
                  {imgs.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" onClick={() => setActiveImg(i)}
                      className={`w-10 h-10 rounded-lg object-cover cursor-pointer border-2 transition ${i === activeImg ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <i className="fa fa-image text-5xl text-gray-300" />
              <div className="absolute top-3 left-4 flex gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(s.status)}`}>{s.status}</span>
                {s.is_featured && (
                  <span className="text-xs text-yellow-900 bg-yellow-400 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    <i className="fa fa-star text-[10px]" /> Featured
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            {/* Title + description */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{s.title}</h3>
              {s.description && (
                <>
                  <div className="border-t border-gray-200 my-2.5" />
                  <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                </>
              )}
            </div>

            {/* Price / Delivery / Revisions */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#e84545]/5 border border-[#e84545]/10 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Price</p>
                <p className="text-lg font-bold text-[#e84545]">{formatCurrency(s.price)}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Delivery</p>
                <p className="text-lg font-bold text-gray-900">{s.delivery_days}d</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Revisions</p>
                <p className="text-lg font-bold text-gray-900">{s.revisions}</p>
              </div>
            </div>

            {/* Seller + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Seller</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#e84545] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.seller?.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.seller?.name || '--'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{s.seller?.email || ''}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Category</p>
                {s.category ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
                    {s.category.icon && <i className={`${s.category.icon} text-sm`} />}
                    {s.category.name}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Views',  value: s.views_count,  icon: 'fa-eye',          color: 'text-blue-500'   },
                { label: 'Orders', value: s.orders_count, icon: 'fa-shopping-bag', color: 'text-green-500'  },
                { label: 'Rating', value: s.rating > 0 ? Number(s.rating).toFixed(1) : '--', icon: 'fa-star', color: 'text-yellow-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <i className={`fa ${stat.icon} ${stat.color} text-base mb-1 block`} />
                  <p className="text-base font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            {s.tags && s.tags.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium">#{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky action buttons */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 bg-white">
          <Button size="sm" variant="outline"
            onClick={() => onAction(s.id, 'feature')}
            loading={actionLoading === `feature-${s.id}`}
            leftIcon={<i className={`fa fa-star text-xs ${s.is_featured ? 'text-yellow-400' : ''}`} />}
          >
            {s.is_featured ? 'Unfeature' : 'Feature'}
          </Button>

          {s.status !== 'rejected' ? (
            <Button size="sm" variant="danger"
              onClick={() => onAction(s.id, 'reject')}
              loading={actionLoading === `reject-${s.id}`}
              leftIcon={<i className="fa fa-ban text-xs" />}
            >Reject</Button>
          ) : (
            <Button size="sm"
              onClick={() => onAction(s.id, 'restore')}
              loading={actionLoading === `restore-${s.id}`}
              leftIcon={<i className="fa fa-check-circle text-xs" />}
            >Restore</Button>
          )}

          <button onClick={() => onAction(s.id, 'delete')}
            className="ml-auto px-3 py-1.5 rounded-xl border border-red-200 text-red-500 text-xs hover:bg-red-50 transition flex items-center gap-1.5"
          >
            {actionLoading === `delete-${s.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-trash" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// -- Main Page ---------------------------------------------------------
export default function AdminServicesPage() {
  const [services, setServices]       = useState<Service[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [categoryFilter, setCategory] = useState('');
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const LIMIT = 10;

  const [viewService, setView]          = useState<Service | null>(null);
  const [actionLoading, setAction]      = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search)         params.search      = search;
      if (statusFilter)   params.status      = statusFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      const res = await adminServiceApi.list(params);
      setServices(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { setServices([]); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    categoryApi.list({ page: 1, limit: 100 }).then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchServices, 350);
    return () => clearTimeout(t);
  }, [fetchServices]);

  const doAction = async (id: number, action: 'reject' | 'restore' | 'feature' | 'delete') => {
    if (action === 'delete') {
      const svc = services.find((s) => s.id === id) || viewService;
      if (svc) { setDeleteTarget(svc); return; }
    }
    setAction(`${action}-${id}`);
    try {
      if (action === 'reject')  await adminServiceApi.reject(id);
      if (action === 'restore') await adminServiceApi.restore(id);
      if (action === 'feature') await adminServiceApi.feature(id);
      await fetchServices();
      if (viewService?.id === id) {
        const res = await adminServiceApi.get(id);
        setView(res.data);
      }
    } catch { /* ignore */ }
    finally { setAction(''); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setAction(`delete-${deleteTarget.id}`);
    try {
      await adminServiceApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      setView(null);
      await fetchServices();
    } catch { /* ignore */ }
    finally { setAction(''); }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <DashboardLayout role="ADMIN" title="Services">
      <Card padding="none">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" placeholder="Search services or seller..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e84545]"
            />
          </div>
          <CategoryFilter
            categories={categories}
            value={categoryFilter}
            onChange={(v) => { setCategory(v); setPage(1); }}
          />
          <div className="ml-auto flex gap-1.5 flex-wrap">
            {[{ label: 'All', value: '' }, { label: 'Active', value: 'active' }, { label: 'Paused', value: 'paused' }, { label: 'Rejected', value: 'rejected' }].map((f) => (
              <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-[#e84545] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} cols={7} /></div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="fa fa-briefcase text-3xl mb-2 block" />
              <p className="text-sm">No services found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Service', 'Seller', 'Category', 'Price', 'Orders', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300">
                            <i className="fa fa-image text-sm" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1 max-w-[180px]">{s.title}</p>
                          <p className="text-[10px] text-gray-400">{s.delivery_days}d . {s.revisions} rev</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 text-xs font-medium">{s.seller?.name || '--'}</p>
                      <p className="text-[10px] text-gray-400">{s.seller?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.category?.name || '--'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(s.price)}</td>
                    <td className="px-4 py-3 text-gray-700">{s.orders_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize w-fit ${statusBadge(s.status)}`}>{s.status}</span>
                        {s.is_featured && <span className="text-[10px] text-yellow-600 flex items-center gap-1"><i className="fa fa-star text-[9px]" /> Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setView(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                          <i className="fa fa-eye text-sm" />
                        </button>
                        <button onClick={() => doAction(s.id, 'feature')}
                          className={`p-1.5 rounded-lg transition-colors ${s.is_featured ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                          title={s.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          {actionLoading === `feature-${s.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-star text-sm" />}
                        </button>
                        {s.status !== 'rejected' ? (
                          <button onClick={() => doAction(s.id, 'reject')} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Reject">
                            {actionLoading === `reject-${s.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-ban text-sm" />}
                          </button>
                        ) : (
                          <button onClick={() => doAction(s.id, 'restore')} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Restore">
                            {actionLoading === `restore-${s.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-check-circle text-sm" />}
                          </button>
                        )}
                        <button onClick={() => doAction(s.id, 'delete')} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                          {actionLoading === `delete-${s.id}` ? <Spinner size="xs" color="red" /> : <i className="fa fa-trash text-sm" />}
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
              Showing {Math.min((page - 1) * LIMIT + 1, total)}-{Math.min(page * LIMIT, total)} of {total} services
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
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
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-8 w-8 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors">&gt;</button>
            </div>
          </div>
        )}
      </Card>

      <ServiceDetailModal service={viewService} onClose={() => setView(null)} onAction={doAction} actionLoading={actionLoading} />

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service" size="sm">
        <div className="flex flex-col items-center text-center gap-3 pb-2">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fa fa-trash text-2xl text-red-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 mb-1">Are you sure?</p>
            <p className="text-sm text-gray-500">
              Delete <strong>&quot;{deleteTarget?.title}&quot;</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)} disabled={actionLoading.startsWith('delete-')}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={confirmDelete} loading={actionLoading.startsWith('delete-')}>
            Yes, Delete
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
