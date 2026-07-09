'use client';

/* ─────────────────────────────────────────────────────────────
   Loader.tsx  —  Reusable loading components for MatchCreatorz
   ───────────────────────────────────────────────────────────── */

// ── 1. Small inline spinner ──────────────────────────────────────────
export function Spinner({
  size = 'md',
  color = 'red',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'red' | 'white' | 'gray';
  className?: string;
}) {
  const sizes = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-5 w-5 border-2',
    lg: 'h-7 w-7 border-[3px]',
  };
  const colors = {
    red:   'border-red-100   border-t-[#e84545]',
    white: 'border-white/30  border-t-white',
    gray:  'border-gray-200  border-t-gray-500',
  };
  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin ${className}`} />
  );
}

// ── 2. Centered page-level loader (replaces full content area) ────────
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      {/* Double-ring spinner */}
      <div className="relative h-14 w-14">
        {/* Outer track */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        {/* Outer spinner */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#e84545] animate-spin" />
        {/* Inner track */}
        <div className="absolute inset-[6px] rounded-full border-[3px] border-gray-50" />
        {/* Inner spinner (counter-rotate, lighter) */}
        <div
          className="absolute inset-[6px] rounded-full border-[3px] border-transparent border-t-[#e84545]/40 animate-spin"
          style={{ animationDuration: '1.4s', animationDirection: 'reverse' }}
        />
      </div>
      <p className="text-sm text-gray-400 font-medium animate-pulse tracking-wide">{text}</p>
    </div>
  );
}

// ── 3. Table skeleton — mimics table rows while data loads ─────────────
const COL_WIDTHS = [
  'w-20', 'w-14', 'w-16', 'w-12', 'w-20', 'w-10', 'w-14',
];

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse divide-y divide-gray-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          {/* Avatar + name col */}
          <div className="flex items-center gap-3 flex-[2] min-w-0">
            <div
              className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 flex-shrink-0"
              style={{ opacity: 1 - i * 0.08 }}
            />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3 w-28 bg-gray-200 rounded-full" />
              <div className="h-2 w-36 bg-gray-100 rounded-full" />
            </div>
          </div>
          {/* Data cols */}
          {COL_WIDTHS.slice(0, cols).map((w, j) => (
            <div key={j} className="flex-1 hidden sm:block">
              <div className={`h-3 ${w} bg-gray-${j % 2 === 0 ? '200' : '150'} rounded-full`}
                style={{ background: j % 2 === 0 ? '#e5e7eb' : '#f3f4f6' }} />
            </div>
          ))}
          {/* Action dots */}
          <div className="flex gap-1.5 flex-shrink-0">
            {[1, 2, 3].map(k => (
              <div key={k} className="h-7 w-7 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 4. Card grid skeleton — for categories / grid layouts ─────────────
export function CardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3"
          style={{ opacity: 1 - i * 0.06 }}
        >
          {/* Icon circle */}
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100 mx-auto" />
          {/* Name */}
          <div className="h-3 w-20 bg-gray-200 rounded-full mx-auto" />
          {/* Sub text */}
          <div className="h-2.5 w-28 bg-gray-100 rounded-full mx-auto" />
          {/* Action buttons */}
          <div className="flex gap-2 justify-center mt-1">
            <div className="h-6 w-6 rounded-lg bg-gray-100" />
            <div className="h-6 w-6 rounded-lg bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 5. Stat card skeleton — for dashboard stat cards ──────────────────
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-xl bg-gray-200" />
            <div className="h-5 w-14 rounded-full bg-gray-100" />
          </div>
          <div className="h-7 w-24 bg-gray-200 rounded-lg mb-2" />
          <div className="h-3 w-32 bg-gray-100 rounded-full" />
        </div>
      ))}
    </>
  );
}

// ── 6. Full-screen overlay (on top of existing content while saving) ──
export function OverlayLoader({ text = 'Please wait...' }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 rounded-2xl gap-3">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#e84545] animate-spin" />
      </div>
      <p className="text-xs font-semibold text-gray-500 tracking-wide">{text}</p>
    </div>
  );
}

// ── 7. Dots loader — compact, for inline use ──────────────────────────
export function DotsLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#e84545] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
