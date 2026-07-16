'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppSelector } from '@/store/hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { buyerStatsApi } from '@/lib/adminApi';
import { formatCurrency, formatDate, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

interface BookingRow {
  id: number;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  created_at?: string;
  seller:  { id: number; name: string } | null;
  service: { id: number; title: string } | null;
}

interface JobRow {
  id: number;
  title: string;
  status: string;
  bids_count: number;
  budget_min: number | null;
  budget_max: number | null;
  createdAt: string;
  created_at?: string;
}

interface StatsData {
  stats: {
    activeBookings: number;
    completedBookings: number;
    totalSpent: number;
    totalJobs: number;
    openJobs: number;
  };
  recentBookings: BookingRow[];
  recentJobs: JobRow[];
  monthlySpend: { month: string; amount: number }[];
}

export default function BuyerHomePage() {
  const { user }  = useAppSelector((s) => s.auth);
  const [data,    setData]    = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    buyerStatsApi.get()
      .then(r => setData(r.data))
      .catch(err => {
        console.error('Buyer stats error:', err);
        setError(err?.message || 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  const statCards = [
    { icon: 'fa-calendar',  color: '#4f9ef8', bg: '#eff6ff', label: 'Active Bookings',   val: loading ? '...' : (s?.activeBookings ?? 0).toString(),       sub: 'In progress',    href: '/buyer/bookings' },
    { icon: 'fa-check',     color: '#10b981', bg: '#ecfdf5', label: 'Completed',         val: loading ? '...' : (s?.completedBookings ?? 0).toString(),    sub: 'All time',       href: '/buyer/bookings' },
    { icon: 'fa-line-chart',color: '#e84545', bg: '#fef2f2', label: 'Total Spent',       val: loading ? '...' : formatCurrency(s?.totalSpent ?? 0),         sub: 'On completed',   href: '/buyer/bookings' },
    { icon: 'fa-briefcase', color: '#f59e0b', bg: '#fffbeb', label: 'My Jobs',           val: loading ? '...' : (s?.totalJobs ?? 0).toString(),             sub: `${s?.openJobs ?? 0} open`,  href: '/buyer/jobs' },
  ];

  return (
    <DashboardLayout role="BUYER" title="Dashboard">
      <div className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <i className="fa fa-exclamation-circle" />
            <span>Dashboard error: {error}</span>
          </div>
        )}

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
            ) : (data?.monthlySpend || []).length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center gap-2">
                <i className="fa fa-bar-chart text-gray-200 text-3xl" />
                <p className="text-sm text-gray-400">No spending data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthlySpend || []} barSize={28} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Spent']} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '12px' }} />
                  <Bar dataKey="amount" fill="#e84545" radius={[6, 6, 0, 0]} maxBarSize={48} />
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

        {/* -- Recent Jobs -- */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-800">Recent Jobs</h3>
            <Link href="/buyer/jobs" className="text-xs text-[#e84545] font-semibold hover:underline">View all <i className="fa fa-chevron-right text-xs" /></Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-xl" />
              ))
            ) : (data?.recentJobs || []).length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No jobs posted yet. <Link href="/buyer/jobs" className="text-[#e84545]">Post a job</Link></p>
            ) : (
              (data?.recentJobs || []).map(j => {
                const statusColor: Record<string, string> = {
                  OPEN:        'bg-green-50 text-green-700 border-green-200',
                  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
                  CLOSED:      'bg-gray-100 text-gray-500 border-gray-200',
                  CANCELLED:   'bg-red-50 text-red-600 border-red-200',
                };
                return (
                  <div key={j.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#e84545]/20 transition">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <i className="fa fa-briefcase text-amber-500 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{j.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <i className="fa fa-gavel mr-1" />{j.bids_count} bids
                        {j.budget_min && j.budget_max && (
                          <span className="ml-2"><i className="fa fa-dollar mr-0.5" />{Number(j.budget_min).toLocaleString()} - {Number(j.budget_max).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor[j.status] || statusColor.OPEN}`}>{j.status}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* -- Recent Bookings -- */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-800">Recent Bookings</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your latest service orders</p>
            </div>
            <Link href="/buyer/bookings" className="text-xs text-[#e84545] font-semibold hover:underline flex items-center gap-1">
              View all <i className="fa fa-chevron-right text-xs" />
            </Link>
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
              <p className="text-xs text-gray-400 mt-1">
                <Link href="/buyer/search" className="text-[#e84545] hover:underline">Browse services</Link> to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.recentBookings || []).map(b => (
                <Link key={b.id} href="/buyer/bookings"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-[#e84545]/30 hover:bg-red-50/30 transition group">
                  <Avatar name={b.seller?.name || 'S'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#e84545] transition">
                      {b.service?.title || b.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span><i className="fa fa-user mr-1" />{b.seller?.name || '-'}</span>
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
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
