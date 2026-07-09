'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatDate, getBookingStatusColor } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stats = [
  { title: 'Total Users',    value: '12,450', icon: 'fa-users',        change: '12% this month', changeType: 'up' as const,   color: 'red' as const },
  { title: 'Active Sellers', value: '3,280',  icon: 'fa-briefcase',    change: '8% this month',  changeType: 'up' as const,   color: 'blue' as const },
  { title: 'Total Bookings', value: '8,920',  icon: 'fa-calendar-check-o', change: '5% this month', changeType: 'up' as const,   color: 'green' as const },
  { title: 'Revenue',        value: '$142K',  icon: 'fa-dollar',   change: '18% this month', changeType: 'up' as const,   color: 'purple' as const },
];

const chartData = [
  { month: 'Jan', revenue: 12000, bookings: 320 },
  { month: 'Feb', revenue: 18000, bookings: 410 },
  { month: 'Mar', revenue: 14500, bookings: 360 },
  { month: 'Apr', revenue: 22000, bookings: 520 },
  { month: 'May', revenue: 28000, bookings: 640 },
  { month: 'Jun', revenue: 24000, bookings: 580 },
  { month: 'Jul', revenue: 32000, bookings: 720 },
];

const recentBookings = [
  { id: 1, buyer: 'Alice Johnson', seller: 'Bob Smith', service: 'Logo Design', amount: 250, status: 'Ongoing', date: '2024-11-10' },
  { id: 2, buyer: 'Carlos Ruiz',   seller: 'Diana Prince', service: 'Web Dev',    amount: 1200, status: 'Completed', date: '2024-11-09' },
  { id: 3, buyer: 'Eva Green',     seller: 'Frank Miller', service: 'SEO Setup',  amount: 400, status: 'Pending', date: '2024-11-08' },
  { id: 4, buyer: 'Grace Hopper',  seller: 'Henry Ford',   service: 'Video Edit', amount: 800, status: 'In-dispute', date: '2024-11-07' },
  { id: 5, buyer: 'Iris West',     seller: 'Jake Long',    service: 'Copywriting',amount: 150, status: 'Completed', date: '2024-11-06' },
];

const pendingWithdrawals = [
  { id: 1, name: 'Bob Smith',   amount: 840,  date: '2024-11-10' },
  { id: 2, name: 'Diana Prince', amount: 1200, date: '2024-11-09' },
  { id: 3, name: 'Frank Miller', amount: 360,  date: '2024-11-08' },
];

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="ADMIN" title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      {/* Chart + Pending */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle>Revenue & Bookings</CardTitle>
            <Badge variant="success" dot>Live</Badge>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e84545" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e84545" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#e84545" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pending Withdrawals */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Pending Withdrawals</CardTitle>
            <Badge variant="warning">{pendingWithdrawals.length}</Badge>
          </CardHeader>
          <div className="space-y-3">
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <Avatar name={w.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{w.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(w.date)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(w.amount)}</p>
              </div>
            ))}
            <button className="w-full text-center text-xs text-[#e84545] hover:text-red-700 font-medium py-1 transition-colors">
              View all →
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <button className="text-xs text-[#e84545] hover:text-red-700 font-medium transition-colors">View all</button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Buyer', 'Seller', 'Service', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={b.buyer} size="xs" />
                      <span className="font-medium text-gray-700">{b.buyer}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{b.seller}</td>
                  <td className="py-3 pr-4 text-gray-600">{b.service}</td>
                  <td className="py-3 pr-4 font-semibold text-gray-900">{formatCurrency(b.amount)}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 text-xs">{formatDate(b.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
