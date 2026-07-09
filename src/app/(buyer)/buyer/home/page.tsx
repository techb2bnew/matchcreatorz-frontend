'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAppSelector } from '@/store/hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

const spendData = [
  { month: 'Jan', amount: 800  },
  { month: 'Feb', amount: 1200 },
  { month: 'Mar', amount: 600  },
  { month: 'Apr', amount: 1800 },
  { month: 'May', amount: 1400 },
  { month: 'Jun', amount: 2200 },
];

const recentBookings = [
  { id: 1, seller: 'Alex Johnson',  service: 'Logo Design',        amount: 2500,  status: 'Ongoing',    avatar: 'AJ', date: 'Jun 28' },
  { id: 2, seller: 'Priya Sharma',  service: 'Social Media Posts', amount: 1800,  status: 'Completed',  avatar: 'PS', date: 'Jun 25' },
  { id: 3, seller: 'Rahul Verma',   service: 'Video Editing',      amount: 3500,  status: 'In Review',  avatar: 'RV', date: 'Jun 22' },
  { id: 4, seller: 'Neha Gupta',    service: 'Content Writing',    amount: 1200,  status: 'Completed',  avatar: 'NG', date: 'Jun 18' },
];

const recommended = [
  { name: 'Alex Johnson',  skill: 'UI/UX Design',        rating: 4.9, jobs: 124, price: '$1,500', avatar: 'AJ', color: '#e84545' },
  { name: 'Priya Sharma',  skill: 'Social Media',        rating: 4.8, jobs: 89,  price: '$900',   avatar: 'PS', color: '#4f9ef8' },
  { name: 'Karan Mehta',   skill: 'Video Production',    rating: 4.7, jobs: 67,  price: '$2,200', avatar: 'KM', color: '#10b981' },
  { name: 'Sonal Joshi',   skill: 'Content Writing',     rating: 4.9, jobs: 145, price: '$800',   avatar: 'SJ', color: '#f59e0b' },
];

const statusColor: Record<string, { bg: string; text: string }> = {
  'Ongoing':   { bg: '#dbeafe', text: '#2563eb' },
  'Completed': { bg: '#d1fae5', text: '#059669' },
  'In Review': { bg: '#fef3c7', text: '#d97706' },
  'Cancelled': { bg: '#fee2e2', text: '#dc2626' },
};

export default function BuyerHomePage() {
  const { user } = useAppSelector((s) => s.auth);

  const stats = [
    { icon: 'fa-credit-card', color: '#e84545', bg: '#fef2f2', label: 'Wallet Balance',  val: `$${(user?.walletAmount || 2500).toLocaleString()}`, sub: 'Available to spend', href: '/buyer/wallet'    },
    { icon: 'fa-calendar',    color: '#4f9ef8', bg: '#eff6ff', label: 'Active Bookings', val: '3',                                                  sub: '1 needs attention',  href: '/buyer/bookings'  },
    { icon: 'fa-briefcase',   color: '#10b981', bg: '#ecfdf5', label: 'Jobs Posted',     val: '5',                                                  sub: '2 receiving bids',   href: '/buyer/jobs'      },
    { icon: 'fa-heart',       color: '#f59e0b', bg: '#fffbeb', label: 'Favourites',      val: '18',                                                 sub: 'Saved creators',     href: '/buyer/favourites'},
  ];

  return (
    <DashboardLayout role="BUYER" title="Dashboard">
      <div className="space-y-5">

        {/* ── Welcome Banner ── */}
        <div className="rounded-2xl p-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#e84545 0%,#c02a2a 100%)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Welcome back, {user?.fullName?.split(' ')[0] || 'Sarah'} 👋</h2>
            <p className="text-red-100 text-sm mt-1">Find the perfect creator for your next project</p>
            <Link href="/buyer/jobs" className="mt-4 inline-flex items-center bg-white text-[#e84545] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-50 transition shadow-sm">
              <i className="fa fa-plus mr-2" />Post a Job
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {[
              { icon: 'fa-users',  label: '12,000+', sub: 'Creators'  },
              { icon: 'fa-star',   label: '4.8',      sub: 'Avg Rating' },
              { icon: 'fa-check',  label: '98%',      sub: 'Satisfied' },
            ].map(s => (
              <div key={s.label} className="text-center bg-white/10 rounded-2xl px-4 py-3">
                <i className={`fa ${s.icon} text-white text-lg mb-1 block`} />
                <p className="text-white font-bold text-base">{s.label}</p>
                <p className="text-red-100 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Link key={s.label} href={s.href} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5 flex items-center gap-4 hover:border-[#e84545]/40 hover:shadow-sm transition">
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

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Spending Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-800">Spending Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">Monthly spending on services</p>
              </div>
              <span className="text-xs font-semibold text-[#e84545] bg-red-50 px-3 py-1 rounded-full border border-red-100">2024</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spendData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v}`, 'Spent']} contentStyle={{ borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '12px' }} />
                <Bar dataKey="amount" fill="#e84545" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { icon: 'fa-plus-circle',     color: '#e84545', bg: '#fef2f2', label: 'Post a New Job',   desc: 'Find creators for your project', href: '/buyer/jobs'      },
                { icon: 'fa-search',          color: '#4f9ef8', bg: '#eff6ff', label: 'Browse Creators',  desc: 'Search 12,000+ creators',        href: '/buyer/search'    },
                { icon: 'fa-calendar-check-o',color: '#10b981', bg: '#ecfdf5', label: 'View Bookings',    desc: 'Track active projects',          href: '/buyer/bookings'  },
                { icon: 'fa-credit-card',     color: '#f59e0b', bg: '#fffbeb', label: 'Add Wallet Money', desc: 'Top up your balance',            href: '/buyer/wallet'    },
              ].map(a => (
                <Link key={a.label} href={a.href} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#e8e8e8] shadow-sm hover:border-[#e84545] hover:bg-red-50 transition text-left">
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

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Recent Bookings</h3>
              <Link href="/buyer/bookings" className="text-xs text-[#e84545] font-semibold hover:underline">View all <i className="fa fa-chevron-right text-xs" /></Link>
            </div>
            <div className="space-y-3">
              {recentBookings.map(b => {
                const sc = statusColor[b.status] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#e84545]/20 transition">
                    <div className="h-10 w-10 rounded-xl bg-[#e84545] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{b.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{b.service}</p>
                      <p className="text-xs text-gray-400 mt-0.5"><i className="fa fa-user mr-1" />{b.seller} · {b.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">${b.amount.toLocaleString()}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Creators */}
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Top Creators</h3>
              <Link href="/buyer/search" className="text-xs text-[#e84545] font-semibold hover:underline">See all</Link>
            </div>
            <div className="space-y-3">
              {recommended.map(c => (
                <div key={c.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: c.color }}>
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.skill}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-800">{c.price}</p>
                    <p className="text-xs text-yellow-500"><i className="fa fa-star" /> {c.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
