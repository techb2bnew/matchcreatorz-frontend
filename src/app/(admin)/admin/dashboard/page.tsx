'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminStatsApi } from '@/lib/adminApi';

interface BookingRow {
  id: number;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  created_at?: string;
  buyer:   { id: number; name: string } | null;
  seller:  { id: number; name: string } | null;
  service: { id: number; title: string } | null;
}

interface StatsData {
  stats: {
    totalUsers: number;
    totalSellers: number;
    totalBuyers: number;
    totalServices: number;
    totalJobs: number;
    openJobs: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
  };
  recentBookings: BookingRow[];
  monthlyRevenue: { month: string; revenue: number; bookings: number }[];
}

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data,    setData]    = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    adminStatsApi.get()
      .then(r => setData(r.data))
      .catch(err => {
        console.error('Admin stats error:', err);
        setError(err?.message || 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  const statCards = s ? [
    { title: 'Total Users',    value: s.totalUsers.toLocaleString(),    icon: 'fa-users',             change: `${s.totalSellers} sellers`,   color: 'red' as const    },
    { title: 'Active Sellers', value: s.totalSellers.toLocaleString(),  icon: 'fa-briefcase',         change: `${s.totalBuyers} buyers`,     color: 'blue' as const   },
    { title: 'Total Bookings', value: s.totalBookings.toLocaleString(), icon: 'fa-calendar-check-o',  change: `${s.pendingBookings} pending`, color: 'green' as const  },
    { title: 'Revenue',        value: formatCurrency(s.totalRevenue),   icon: 'fa-dollar',            change: `${s.completedBookings} done`, color: 'purple' as const },
  ] : [];

  return (
    <DashboardLayout role="ADMIN" title="Dashboard">
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <i className="fa fa-exclamation-circle" />
          <span>Dashboard error: {error}</span>
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((s) => <StatCard key={s.title} {...s} />)
        }
      </div>

      {/* Chart + Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <Badge variant="success" dot>Live</Badge>
          </CardHeader>
          {loading ? (
            <div className="h-[220px] animate-pulse bg-gray-100 rounded-xl" />
          ) : (data?.monthlyRevenue || []).length < 2 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <i className="fa fa-bar-chart text-gray-300 text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Not enough data yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Revenue chart will appear once bookings are completed</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.monthlyRevenue || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#e84545" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e84545" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 13 }}
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#e84545" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#e84545' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quick info */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl" />
              ))
            ) : s ? [
              { label: 'Total Users',    value: s.totalUsers,        icon: 'fa-users',        color: 'text-blue-600 bg-blue-50',    href: '/admin/sellers'  },
              { label: 'Total Services', value: s.totalServices,     icon: 'fa-cubes',        color: 'text-purple-600 bg-purple-50', href: '/admin/services' },
              { label: 'Completed',      value: s.completedBookings, icon: 'fa-check-circle', color: 'text-green-600 bg-green-50',  href: '/admin/bookings' },
              { label: 'Pending',        value: s.pendingBookings,   icon: 'fa-clock-o',      color: 'text-orange-600 bg-orange-50', href: '/admin/bookings' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer group">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <i className={`fa ${item.icon} text-xs`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">{item.label}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
                  <i className="fa fa-chevron-right text-gray-300 text-xs group-hover:text-[#e84545] transition-colors" />
                </div>
              </a>
            )) : null}
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-800">Recent Bookings</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest transactions across the platform</p>
          </div>
          <a href="/admin/bookings" className="text-xs text-[#e84545] font-semibold hover:underline flex items-center gap-1">
            View all <i className="fa fa-chevron-right text-xs" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-xl bg-gray-50">
                <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                   <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (data?.recentBookings || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <i className="fa fa-calendar text-gray-300 text-2xl" />
            </div>
            <p className="text-sm font-medium text-gray-500">No bookings yet on the platform</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Buyer', 'Seller', 'Service / Job', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.recentBookings || []).map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={b.buyer?.name || 'B'} size="xs" />
                        <span className="font-medium text-gray-800 whitespace-nowrap">{b.buyer?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={b.seller?.name || 'S'} size="xs" />
                        <span className="text-gray-600 whitespace-nowrap">{b.seller?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 max-w-[160px] truncate">{b.service?.title || b.title}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(b.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getBookingStatusColor(b.status)}`}>
                        {getBookingStatusLabel(b.status)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(b.createdAt || b.created_at || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
