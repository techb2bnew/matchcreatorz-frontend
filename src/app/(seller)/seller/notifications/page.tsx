'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { sellerNotificationApi } from '@/lib/adminApi';

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
  if (type.startsWith('booking') || type === 'work_submitted' || type === 'work_accepted') return 'Bookings';
  if (type.startsWith('bid')) return 'Jobs';
  if (type === 'review_received') return 'Reviews';
  return 'System';
};

const categoryIcon = (cat: string): string => {
  if (cat === 'Bookings') return 'fa-calendar';
  if (cat === 'Jobs')     return 'fa-briefcase';
  if (cat === 'Reviews')  return 'fa-star';
  return 'fa-bell';
};

const categoryColor = (cat: string): string => {
  if (cat === 'Bookings') return 'bg-blue-50 text-blue-600';
  if (cat === 'Jobs')     return 'bg-purple-50 text-purple-600';
  if (cat === 'Reviews')  return 'bg-yellow-50 text-yellow-600';
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

const FILTERS = ['All', 'Bookings', 'Jobs', 'Reviews', 'System'] as const;
type Filter = typeof FILTERS[number];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState<Filter>('All');
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const LIMIT = 20;

  const fetchNotifications = useCallback(async (pg = 1) => {
    try {
      setLoading(true);
      const res  = await sellerNotificationApi.list({ page: pg, limit: LIMIT });
      const rows: ApiNotification[] = res?.data?.data ?? [];
      setNotifications((prev) => pg === 1 ? rows : [...prev, ...rows]);
      setTotal(res?.data?.total ?? 0);
      setPage(pg);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(1); }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await sellerNotificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await sellerNotificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await sellerNotificationApi.delete(id);
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

  const filtered = activeFilter === 'All'
    ? normalised
    : normalised.filter((n) => typeToCategory(n.type) === activeFilter);

  const hasMore = notifications.length < total;

  return (
    <DashboardLayout role="SELLER" title="Notifications">
      {/* Top row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" leftIcon={<i className="fa fa-bell-slash text-sm" />} onClick={handleMarkAllRead}>
          Mark all as read
        </Button>
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
            <p className="text-sm">No notifications</p>
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
