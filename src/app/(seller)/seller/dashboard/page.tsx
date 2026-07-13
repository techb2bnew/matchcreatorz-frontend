'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, getBookingStatusColor } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sellerStatsApi } from '@/lib/adminApi';

interface BookingRow {
  id: number;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  buyer:   { id: number; name: string } | null;
  service: { id: number; title: string } | null;
}

interface StatsData {
  stats: {
    activeBookings: number;
    completedBookings: number;
    totalEarnings: number;
    totalServices: number;
    avgRating: string;
    totalReviews: number;
  };
  recentBookings: BookingRow[];
  monthlyEarnings: { month: string; amount: number }[];
}

export default function SellerDashboardPage() {
  const [data,    setData]    = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerStatsApi.get()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  const statCards = s ? [
    { title: 'Active Bookings', value: s.activeBookings.toString(),              icon: 'fa-calendar-check-o', color: 'blue' as const,   change: 'Currently running'       },
    { title: 'Total Earnings',  value: formatCurrency(s.totalEarnings),          icon: 'fa-line-chart',       color: 'green' as const,  change: 'All time completed'      },
    { title: 'My Services',     value: s.totalServices.toString(),               icon: 'fa-cubes',            color: 'red' as const,    change: 'Active listings'         },
    { title: 'Avg Rating',      value: s.avgRating,                              icon: 'fa-star',             color: 'orange' as const, change: `${s.totalReviews} reviews`},
  ] : [];

  return (
    <DashboardLayout role="SELLER" title="My Dashboard">
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
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthlyEarnings || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 13 }}
                  formatter={(v: number) => [formatCurrency(v), 'Earnings']}
                />
                <Bar dataKey="amount" fill="#e84545" radius={[6, 6, 0, 0]} />
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
              { label: 'Completed Bookings', value: s.completedBookings, icon: 'fa-check-circle', color: 'text-green-600 bg-green-50'  },
              { label: 'Active Bookings',    value: s.activeBookings,    icon: 'fa-clock-o',      color: 'text-blue-600 bg-blue-50'    },
              { label: 'Total Reviews',      value: s.totalReviews,      icon: 'fa-star',         color: 'text-yellow-600 bg-yellow-50'},
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
      <Card padding="md">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <a href="/seller/bookings"><Button variant="ghost" size="sm">View all</Button></a>
        </CardHeader>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
            ))
          ) : (data?.recentBookings || []).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No bookings yet</p>
          ) : (
            (data?.recentBookings || []).map(b => (
              <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <Avatar name={b.buyer?.name || 'B'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{b.service?.title || b.title}</p>
                  <p className="text-xs text-gray-400">Client: {b.buyer?.name || '-'}</p>
                </div>
                <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}>
                  {b.status}
                </span>
                <p className="font-semibold text-gray-900 text-sm">{formatCurrency(b.amount)}</p>
                <span className="text-xs text-gray-400">{formatDate(b.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
