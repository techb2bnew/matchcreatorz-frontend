'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sellerStatsApi } from '@/lib/adminApi';

interface BookingRow {
  id: number;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  created_at?: string;
  buyer:   { id: number; name: string } | null;
  service: { id: number; title: string } | null;
}

interface StatsData {
  stats: {
    activeBookings: number;
    completedBookings: number;
    totalEarnings: number;
    totalServices: number;
    pendingBids: number;
    avgRating: string;
    totalReviews: number;
  };
  recentBookings: BookingRow[];
  monthlyEarnings: { month: string; amount: number }[];
}

export default function SellerDashboardPage() {
  const [data,    setData]    = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    sellerStatsApi.get()
      .then(r => setData(r.data))
      .catch(err => {
        console.error('Seller stats error:', err);
        setError(err?.message || 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  const statCards = s ? [
    { title: 'Active Bookings', value: s.activeBookings.toString(),              icon: 'fa-calendar-check-o', color: 'blue' as const,   change: 'Currently running'       },
    { title: 'Total Earnings',  value: formatCurrency(s.totalEarnings),          icon: 'fa-line-chart',       color: 'green' as const,  change: 'All time completed'      },
    { title: 'My Services',     value: s.totalServices.toString(),               icon: 'fa-cubes',            color: 'red' as const,    change: 'Active listings'         },
    { title: 'Pending Bids',    value: s.pendingBids.toString(),                 icon: 'fa-gavel',            color: 'orange' as const, change: 'Awaiting acceptance'     },
  ] : [];

  return (
    <DashboardLayout role="SELLER" title="My Dashboard">
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <i className="fa fa-exclamation-circle" />
          <span>Dashboard error: {error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))
          : statCards.map(s => <StatCard key={s.title} {...s} />)
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Earnings Chart */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <Badge variant="primary">Last 6 months</Badge>
          </CardHeader>
          {loading ? (
            <div className="h-[220px] animate-pulse bg-gray-100 rounded-xl" />
          ) : (data?.monthlyEarnings || []).length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <i className="fa fa-bar-chart text-gray-300 text-2xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">No earnings yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Chart will appear once bookings are completed</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthlyEarnings || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 13 }}
                  formatter={(v: number) => [formatCurrency(v), 'Earnings']}
                />
                <Bar dataKey="amount" fill="#e84545" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Summary */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl" />
              ))
            ) : s ? [
              { label: 'Completed Bookings', value: s.completedBookings, icon: 'fa-check-circle', color: 'text-green-600 bg-green-50'   },
              { label: 'Active Bookings',    value: s.activeBookings,    icon: 'fa-clock-o',      color: 'text-blue-600 bg-blue-50'     },
              { label: 'Pending Bids',       value: s.pendingBids,       icon: 'fa-gavel',        color: 'text-orange-600 bg-orange-50' },
              { label: 'Total Reviews',      value: s.totalReviews,      icon: 'fa-star',         color: 'text-yellow-600 bg-yellow-50' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <i className={`fa ${item.icon} text-xs`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{item.value}</p>
              </div>
            )) : null}
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-800">Recent Bookings</h3>
             <p className="text-xs text-gray-400 mt-0.5">Your latest client orders</p>
          </div>
          <a href="/seller/bookings" className="text-xs text-[#e84545] font-semibold hover:underline flex items-center gap-1">
            View all <i className="fa fa-chevron-right text-xs" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-xl bg-gray-50">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : (data?.recentBookings || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <i className="fa fa-calendar text-gray-300 text-2xl" />
            </div>
            <p className="text-sm font-medium text-gray-500">No bookings yet</p>
            <p className="text-xs text-gray-400 mt-1">Bookings from buyers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.recentBookings || []).map(b => (
              <a key={b.id} href="/seller/bookings"
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-[#e84545]/30 hover:bg-red-50/30 transition group">
                <Avatar name={b.buyer?.name || 'B'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#e84545] transition">
                    {b.service?.title || b.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    <span><i className="fa fa-user mr-1" />Client: {b.buyer?.name || '-'}</span>
                    <span className="text-gray-300">.</span>
                    <span>{formatDate(b.createdAt || b.created_at || '')}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(b.amount)}</p>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBookingStatusColor(b.status)}`}>
                    {getBookingStatusLabel(b.status)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
