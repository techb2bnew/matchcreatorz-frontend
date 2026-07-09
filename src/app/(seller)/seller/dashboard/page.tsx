'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, getBookingStatusColor } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stats = [
  { title: 'Wallet Balance',  value: '$2,840', icon: 'fa-dollar',    color: 'red' as const,    change: 'Available to withdraw' },
  { title: 'Active Bookings', value: '7',      icon: 'fa-calendar-check-o', color: 'blue' as const,   change: '2 need attention' },
  { title: 'Total Earnings',  value: '$18,200',icon: 'fa-line-chart',    color: 'green' as const,  change: 'All time' },
  { title: 'Avg Rating',      value: '4.8',    icon: 'fa-star',          color: 'orange' as const, change: '124 reviews' },
];

const earningsData = [
  { month: 'Jun', amount: 1200 },
  { month: 'Jul', amount: 2100 },
  { month: 'Aug', amount: 1800 },
  { month: 'Sep', amount: 2800 },
  { month: 'Oct', amount: 3200 },
  { month: 'Nov', amount: 2400 },
];

const activeBookings = [
  { id: 1, buyer: 'Alice J.',  service: 'Logo Design',   amount: 250,  status: 'Ongoing',                  daysLeft: 3 },
  { id: 2, buyer: 'Carlos R.', service: 'Brand Identity', amount: 800,  status: 'Amidst-Completion-Process', daysLeft: 0 },
  { id: 3, buyer: 'Eva G.',    service: 'Icon Set',       amount: 120,  status: 'Ongoing',                  daysLeft: 7 },
];

export default function SellerDashboardPage() {
  return (
    <DashboardLayout role="SELLER" title="My Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Earnings Chart */}
        <Card className="xl:col-span-2" padding="md">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <Badge variant="primary">2024</Badge>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 13 }} formatter={(v) => [`$${v}`, 'Earnings']} />
              <Bar dataKey="amount" fill="#e84545" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Connects */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>My Connects</CardTitle>
            <i className="fa fa-link text-sm text-gray-400" />
          </CardHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-black text-[#e84545] mb-1">48</div>
            <p className="text-sm text-gray-400">Connects remaining</p>
            <p className="text-xs text-gray-300 mt-1">Each bid costs ~20 connects</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-[#e84545] h-2 rounded-full" style={{ width: '48%' }} />
          </div>
          <Button fullWidth variant="outline" size="sm">Buy More Connects</Button>
        </Card>
      </div>

      {/* Active Bookings */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Active Bookings</CardTitle>
          <Button variant="ghost" size="sm">View all</Button>
        </CardHeader>
        <div className="space-y-3">
          {activeBookings.map((b) => (
            <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <Avatar name={b.buyer} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{b.service}</p>
                <p className="text-xs text-gray-400">Client: {b.buyer}</p>
              </div>
              <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(b.status)}`}>{b.status}</span>
              <p className="font-semibold text-gray-900 text-sm">{formatCurrency(b.amount)}</p>
              {b.daysLeft > 0 && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{b.daysLeft}d left</span>}
              {b.status === 'Amidst-Completion-Process' && (
                <Button size="sm" variant="success">Accept</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
