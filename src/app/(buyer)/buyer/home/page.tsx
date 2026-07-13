'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppSelector } from '@/store/hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { buyerStatsApi } from '@/lib/adminApi';
import { formatCurrency, formatDate, getBookingStatusColor } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

interface BookingRow {
  id: number;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  seller:  { id: number; name: string } | null;
  service: { id: number; title: string } | null;
}

interface StatsData {
  stats: {
    activeBookings: number;
    completedBookings: number;
    totalSpent: number;
  };
  recentBookings: BookingRow[];
  monthlySpend: { month: string; amount: number }[];
}

export default function BuyerHomePage() {
  const { user }  = useAppSelector((s) => s.auth);
  const [data,    setData]    = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buyerStatsApi.get()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  const statCards = [
    { icon: 'fa-calendar',  color: '#4f9ef8', bg: '#eff6ff', label: 'Active Bookings',   val: loading ? '...' : (s?.activeBookings ?? 0).toString(),       sub: 'In progress',    href: '/buyer/bookings' },
    { icon: 'fa-check',     color: '#10b981', bg: '#ecfdf5', label: 'Completed',         val: loading ? '...' : (s?.completedBookings ?? 0).toString(),    sub: 'All time',       href: '/buyer/bookings' },
    { icon: 'fa-line-chart',color: '#e84545', bg: '#fef2f2', label: 'Total Spent',       val: loading ? '...' : formatCurrency(s?.totalSpent ?? 0),         sub: 'On completed',   href: '/buyer/bookings' },
    { icon: 'fa-briefcase', color: '#f59e0b', bg: '#fffbeb', label: 'My Jobs',           val: '--',                                                         sub: 'Posted jobs',    href: '/buyer/jobs'     },
  ];

  return (
    <DashboardLayout role="BUYER" title="Dashboard">
      <div className="space-y-5">

        {/* -- Welcome Banner -- */}
        <div className="rounded-2xl p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#e84545 0%,#c02a2a 100%)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Welcome back, {user?.fullName?.split(' ')[0] || 'there'}</h2>
            <p className="text-red-100 text-sm mt-1">Find the perfect creator for your next project</p>
            <Link href="/buyer/jobs" className="mt-4 inline-flex items-center bg-white text-[#e84545] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-50 transition shadow-sm">
              <i className="fa fa-plus mr-2" />Post a Job
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {[
              { icon: 'fa-users', label: '12,000+', sub: 'Creators'   },
              { icon: 'fa-star',  label: '4.8',     sub: 'Avg Rating' },
              { icon: 'fa-check', label: '98%',     sub: 'Satisfied'  },
            ].map(i => (
              <div key={i.label} className="text-center bg-white/10 rounded-2xl px-4 py-3">
                <i className={`fa ${i.icon} text-white text-lg mb-1 block`} />
                <p className="text-white font-bold text-base">{i.label}</p>
                <p className="text-red-100 text-xs">{i.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* -- Stat Cards -- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(s => (
            <Link key={s.label} href={s.href} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5 flex items-center gap-4 hover:border-[#e84545]/40 transition">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`fa ${s.icon} text-xl`} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.val}</p>
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* -- Main Grid -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Spending Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-800">Spending Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">Monthly spending on services</p>
              </div>
              <span className="text-xs font-semibold text-[#e84545] bg-red-50 px-3 py-1 rounded-full border border-red-100">Last 6 months</span>
            </div>
            {loading ? (
              <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthlySpend || []} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Spent']} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '12px' }} />
                  <Bar dataKey="amount" fill="#e84545" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { icon: 'fa-plus-circle',      color: '#e84545', bg: '#fef2f2', label: 'Post a New Job',   desc: 'Find creators',          href: '/buyer/jobs'     },
                { icon: 'fa-search',           color: '#4f9ef8', bg: '#eff6ff', label: 'Browse Creators',  desc: 'Search creators',        href: '/buyer/search'   },
                { icon: 'fa-calendar-check-o', color: '#10b981', bg: '#ecfdf5', label: 'View Bookings',    desc: 'Track active projects',  href: '/buyer/bookings' },
                { icon: 'fa-credit-card',      color: '#f59e0b', bg: '#fffbeb', label: 'Wallet',           desc: 'View balance',           href: '/buyer/wallet'   },
              ].map(a => (
                <Link key={a.label} href={a.href} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#e8e8e8] hover:border-[#e84545] hover:bg-red-50 transition text-left">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.bg }}>
                    <i className={`fa ${a.icon} text-sm`} style={{ color: a.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                  <i className="fa fa-chevron-right text-gray-300 text-xs ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* -- Recent Bookings -- */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-800">Recent Bookings</h3>
            <Link href="/buyer/bookings" className="text-xs text-[#e84545] font-semibold hover:underline">View all <i className="fa fa-chevron-right text-xs" /></Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
              ))
            ) : (data?.recentBookings || []).length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No bookings yet. <Link href="/buyer/search" className="text-[#e84545]">Browse services</Link></p>
            ) : (
              (data?.recentBookings || []).map(b => (
                <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#e84545]/20 transition">
                  <Avatar name={b.seller?.name || 'S'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.service?.title || b.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <i className="fa fa-user mr-1" />{b.seller?.name || '-'} &nbsp;{formatDate(b.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(b.amount)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBookingStatusColor(b.status)}`}>{b.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
