'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { publicStatsApi, PublicPlatformStats } from '@/lib/adminApi';

/** Compact "50K+" style rounding for big counts; small counts show as-is. */
function formatCount(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K+`;
  if (n > 0) return `${n}+`;
  return '0';
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<PublicPlatformStats | null>(null);

  useEffect(() => {
    publicStatsApi.get().then((res) => setStats(res.data)).catch(() => {/* keep placeholders on failure */});
  }, []);

  const statCards = [
    { value: stats ? formatCount(stats.total_creators) : '…', label: 'Creators',     fa: 'fa-users'     },
    { value: stats ? formatCount(stats.total_projects) : '…', label: 'Projects',     fa: 'fa-briefcase' },
    { value: stats ? `${stats.satisfaction_pct}%`       : '…', label: 'Satisfaction', fa: 'fa-thumbs-up' },
  ];

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: '#efefef' }}>

      {/* -- Left panel (brand) ---------------------------- */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12"
        style={{ background: 'linear-gradient(150deg, #1a1a1a 0%, #2d1a1a 60%, #1a1a1a 100%)' }}>
        {/* dot pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="relative text-center">
          <div className="flex justify-center mb-8">
            <Logo className="h-20 w-auto" />
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Connect. Create.<br />
            <span className="text-[#e84545]">Succeed.</span>
          </h2>
          <p className="text-gray-400 text-base max-w-xs mx-auto leading-relaxed">
            The premier marketplace connecting talented creators with ambitious buyers worldwide.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12">
            {statCards.map((s) => (
              <div key={s.label} className="text-center bg-white/5 rounded-2xl py-4 px-3 border border-white/10">
                <i className={`fa ${s.fa} text-[#e84545] text-xl mb-2 block`} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- Right panel (form) ---------------------------- */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[540px] my-auto">
          {/* Mobile logo */}
          <div className="flex justify-center mb-4 lg:hidden">
            <Logo className="h-10 w-auto" />
          </div>
          {/* White card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#e0e0e0] px-6 py-5">
            {children}
          </div>

          {/* Legal links — visible without logging in */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <Link href="/terms-conditions" className="hover:text-[#e84545] transition-colors">Terms &amp; Conditions</Link>
            <span className="text-gray-300">&middot;</span>
            <Link href="/privacy-policy" className="hover:text-[#e84545] transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
