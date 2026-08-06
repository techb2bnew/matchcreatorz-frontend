'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { adminNotificationApi } from '@/lib/adminApi';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ApiNotification {
  id: number;
  title: string;
  body: string | null;
  type: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const typeToCategory = (type: string | null): string => {
  if (!type) return 'System';
  if (type === 'support_message') return 'Support';
  if (type === 'withdrawal_requested') return 'Withdrawals';
  if (type === 'dispute_raised') return 'Disputes';
  if (type === 'seller_registered') return 'Sellers';
  return 'System';
};

const categoryIcon = (cat: string): string => {
  if (cat === 'Support')     return 'fa-life-ring';
  if (cat === 'Withdrawals') return 'fa-money-bill-wave';
  if (cat === 'Disputes')    return 'fa-exclamation-triangle';
  if (cat === 'Sellers')     return 'fa-user-plus';
  return 'fa-bell';
};

const categoryColor = (cat: string): string => {
  if (cat === 'Support')     return 'bg-blue-50 text-blue-600';
  if (cat === 'Withdrawals') return 'bg-green-50 text-green-600';
  if (cat === 'Disputes')    return 'bg-amber-50 text-amber-600';
  if (cat === 'Sellers')     return 'bg-purple-50 text-purple-600';
  return 'bg-[#fff0f0] text-[#e84545]';
};

const relativeTime = (iso: string | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff  = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return d.toLocaleDateString();
};

const FILTERS = ['All', 'Support', 'Withdrawals', 'Disputes', 'Sellers', 'System'] as const;
type Filter = typeof FILTERS[number];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState<Filter>('All');
  const [search, setSearch]               = useState('');
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const LIMIT = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async (pg = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      // On a silent background refresh, re-fetch everything already loaded
      // (page 1 through the current page) in one call so we can safely
      // replace the list without truncating rows the user scrolled to via "Load more".
      const params = silent
        ? { page: 1, limit: pg * LIMIT, search: search || undefined }
        : { page: pg, limit: LIMIT, search: search || undefined };
      const res  = await adminNotificationApi.list(params);
      const rows: ApiNotification[] = res?.data?.data ?? [];
      if (silent) {
        setNotifications(rows);
      } else {
        setNotifications((prev) => pg === 1 ? rows : [...prev, ...rows]);
        setPage(pg);
      }
      setTotal(res?.data?.total ?? 0);
    } catch (err) {
      console.error(silent ? 'Silent notifications refresh failed' : 'Failed to fetch notifications', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchNotifications(1), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchNotifications]);

  useAutoRefresh(() => fetchNotifications(page, true), 20000);

  const handleMarkRead = async (id: number) => {
    try {
      await adminNotificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminNotificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminNotificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    } catch { /* silent */ }
  };

  // normalise field names (Sequelize may return camelCase)
  const normalised = notifications.map((n) => ({
    ...n,
    is_read:    n.is_read ?? n.isRead ?? false,
    created_at: n.created_at ?? n.createdAt,
  }));

  // Text search is server-side (see fetchNotifications) — category is still a
  // client-side filter over whatever page of (already search-matched) rows is loaded.
  const filtered = activeFilter === 'All'
    ? normalised
    : normalised.filter((n) => typeToCategory(n.type) === activeFilter);

  const hasMore = notifications.length < total;

  return (
    <DashboardLayout role="ADMIN" title="Notifications">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        {/* Category pills — horizontally scrollable on mobile since labels
            vary in length and don't wrap evenly in a fixed-width grid */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 sm:flex-wrap sm:overflow-visible">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                activeFilter === f ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9 w-full sm:w-56">
            <i className="fa fa-search text-xs text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<i className="fa fa-bell-slash text-sm" />} onClick={handleMarkAllRead} className="w-full sm:w-auto">
            Mark all as read
          </Button>
        </div>
      </div>

      {/* List */}
      <Card padding="none">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center py-16 text-gray-400">
            <i className="fa fa-spinner fa-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <i className="fa fa-bell-slash text-3xl mb-3" />
            <p className="text-sm">{search.trim() ? 'No notifications match your search' : 'No notifications'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((n) => {
              const cat   = typeToCategory(n.type);
              const icon  = categoryIcon(cat);
              const color = categoryColor(cat);
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 transition-colors group',
                    !n.is_read
                      ? 'bg-[#fff8f8] border-l-4 border-[#e84545] cursor-pointer'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${color}`}>
                    <i className={`fa ${icon} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400">{relativeTime(n.created_at)}</span>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-xs"
                      title="Delete"
                    >
                      <i className="fa fa-trash" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center py-4 border-t border-gray-50">
            <button
              onClick={() => fetchNotifications(page + 1)}
              className="text-sm text-[#e84545] hover:underline"
            >
              Load more
            </button>
          </div>
        )}

        {loading && notifications.length > 0 && (
          <div className="flex justify-center py-4 border-t border-gray-50 text-gray-400 text-sm">
            <i className="fa fa-spinner fa-spin mr-2" /> Loading…
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
