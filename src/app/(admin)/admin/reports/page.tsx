'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import StatCard from '@/components/ui/StatCard';
import { adminReportApi, ReportType, ReportResult } from '@/lib/adminApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

type ReportRow = Record<string, unknown> & { id: number | string };

type StatColor = 'red' | 'blue' | 'green' | 'purple' | 'orange';
const STAT_COLORS: StatColor[] = ['red', 'blue', 'green', 'purple', 'orange'];

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isCurrencyKey(key: string): boolean {
  const k = key.toLowerCase();
  return ['revenue', 'amount', 'earnings', 'topups', 'withdrawals'].some((s) =>
    k.includes(s)
  );
}

function formatStatValue(key: string, value: unknown): string {
  if (typeof value === 'number') {
    return isCurrencyKey(key) ? formatCurrency(value) : value.toLocaleString();
  }
  return String(value);
}

// Icon names are Font Awesome 4.7 (the only version this app loads, via a CDN
// link in layout.tsx) — FA5/6 class names like fa-chart-bar silently render blank.
function pickStatIcon(key: string): string {
  const k = key.toLowerCase();
  if (
    k.includes('revenue') ||
    k.includes('amount') ||
    k.includes('earning') ||
    k.includes('topup') ||
    k.includes('withdrawal')
  ) {
    return 'fa-dollar';
  }
  if (k.includes('user')) return 'fa-users';
  if (k.includes('booking')) return 'fa-calendar-check-o';
  if (k.includes('seller')) return 'fa-shopping-cart';
  if (k.includes('wallet') || k.includes('balance')) return 'fa-money';
  if (k.includes('connect')) return 'fa-link';
  if (k.includes('rate') || k.includes('percent')) return 'fa-percent';
  return 'fa-bar-chart';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function AdminReportsPage() {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [activeType, setActiveType] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Load available report types on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminReportApi.types();
        if (cancelled) return;
        setReportTypes(res.data);
        if (res.data.length > 0) {
          setActiveType(res.data[0].key);
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load report types');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load report data whenever type or date range changes
  const loadReportData = useCallback(async (silent = false) => {
    if (!activeType) return;
    if (!silent) setLoading(true);
    try {
      const res = await adminReportApi.get(activeType, {
        from: from || undefined,
        to: to || undefined,
      });
      setReportData(res.data);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : 'Failed to load report');
      else console.error('Failed to silently refresh report', e);
    } finally {
      setLoading(false);
    }
  }, [activeType, from, to]);

  useEffect(() => { loadReportData(); }, [loadReportData]);

  // Keep the report data current in the background, but never while a CSV
  // export is in progress (an in-flight download shouldn't be disturbed).
  useAutoRefresh(() => loadReportData(true), 20000, !exporting);

  const handleExport = async () => {
    if (!activeType) return;
    setExporting(true);
    try {
      await adminReportApi.export(activeType, {
        from: from || undefined,
        to: to || undefined,
      });
      toast.success('Report exported');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const summaryEntries = reportData ? Object.entries(reportData.summary) : [];
  const statEntries = summaryEntries.filter(
    ([, v]) => typeof v === 'number' || typeof v === 'string'
  ) as [string, number | string][];
  const objectEntries = summaryEntries.filter(([, v]) => isPlainObject(v)) as [
    string,
    Record<string, unknown>
  ][];

  const chartData = reportData?.chart ?? [];
  const rows = (reportData?.rows ?? []) as ReportRow[];

  // 'sellers' chart points put the seller's name in `date` (categorical), not a
  // real timestamp — skip Date parsing for tick/tooltip labels in that case.
  const isCategoricalChart = activeType === 'sellers';

  // 'wallet' chart points carry a `type` discriminator (topup vs withdrawal), so
  // the same date can appear twice. Pivot into one row per date with a value per
  // type, so two distinct trend lines render instead of one zig-zagging line.
  const hasSeriesType = chartData.some((p) => typeof p.type === 'string');
  const walletSeriesKeys = hasSeriesType
    ? Array.from(new Set(chartData.map((p) => p.type).filter((t): t is string => !!t)))
    : [];
  const pivotedChartData = hasSeriesType
    ? Object.values(
        chartData.reduce((acc: Record<string, Record<string, unknown>>, p) => {
          if (!acc[p.date]) acc[p.date] = { date: p.date };
          if (p.type) acc[p.date][p.type] = p.value;
          return acc;
        }, {})
      )
    : chartData;

  const SERIES_COLORS: Record<string, string> = { topup: '#16a34a', withdrawal: '#e84545' };

  const tableColumns = reportData
    ? reportData.columns.map((c) => ({
        key: c.key,
        label: c.label,
        render: (row: ReportRow) => {
          const val = row[c.key];
          if (val === null || val === undefined || val === '') {
            return <span className="text-gray-400">-</span>;
          }
          if (c.key === 'created_at') {
            return <span>{formatDate(val as string | Date | null | undefined)}</span>;
          }
          if (c.key === 'amount' || c.key === 'total_earnings') {
            return <span>{formatCurrency(Number(val) || 0)}</span>;
          }
          return <span>{String(val)}</span>;
        },
      }))
    : [];

  const activeReportType = reportTypes.find((rt) => rt.key === activeType);

  return (
    <DashboardLayout role="ADMIN" title="Reports">
      <div className="space-y-6">
        {/* Report type pills */}
        <div>
          <div className="flex gap-2 flex-wrap">
            {reportTypes.map((rt) => (
              <button
                key={rt.key}
                onClick={() => setActiveType(rt.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === rt.key
                    ? 'bg-[#e84545] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
          {activeReportType?.description && (
            <p className="text-xs text-gray-400 mt-2">{activeReportType.description}</p>
          )}
        </div>

        {/* Filter bar */}
        <Card padding="md">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#e84545] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#e84545] bg-white"
                />
              </div>
              {!from && !to && (
                <p className="text-xs text-gray-400 pb-2">
                  Defaults to the last 30 days
                </p>
              )}
            </div>
            <Button
              leftIcon={<i className="fa fa-download text-sm" />}
              onClick={handleExport}
              loading={exporting}
              disabled={!activeType}
            >
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : statEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statEntries.map(([key, value], idx) => (
              <StatCard
                key={key}
                title={humanizeKey(key)}
                value={formatStatValue(key, value)}
                icon={pickStatIcon(key)}
                color={STAT_COLORS[idx % STAT_COLORS.length]}
              />
            ))}
          </div>
        ) : null}

        {/* Nested summary objects (by_status / by_type / etc.) as chips */}
        {!loading && objectEntries.length > 0 && (
          <div className="space-y-3">
            {objectEntries.map(([key, value]) => (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  {humanizeKey(key)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(value).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                    >
                      {humanizeKey(k)}:{' '}
                      {typeof v === 'number' ? v.toLocaleString() : String(v)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trend chart */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Trend</CardTitle>
          </CardHeader>
          {loading ? (
            <div className="h-[220px] rounded-xl bg-gray-100 animate-pulse" />
          ) : pivotedChartData.length < 2 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-400">
              <i className="fa fa-area-chart text-3xl mb-2" />
              <p className="text-sm">Not enough data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={pivotedChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e84545" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e84545" stopOpacity={0} />
                  </linearGradient>
                  {walletSeriesKeys.map((key) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SERIES_COLORS[key] || '#e84545'} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={SERIES_COLORS[key] || '#e84545'} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) =>
                    isCategoricalChart
                      ? (v.length > 12 ? `${v.slice(0, 12)}…` : v)
                      : new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: 13,
                  }}
                  labelFormatter={(v) =>
                    isCategoricalChart
                      ? String(v)
                      : new Date(v as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  }
                />
                {hasSeriesType ? (
                  walletSeriesKeys.map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={humanizeKey(key)}
                      stroke={SERIES_COLORS[key] || '#e84545'}
                      strokeWidth={2}
                      fill={`url(#grad-${key})`}
                      dot={false}
                      activeDot={{ r: 5, fill: SERIES_COLORS[key] || '#e84545' }}
                    />
                  ))
                ) : (
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#e84545"
                    strokeWidth={2}
                    fill="url(#reportGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#e84545' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Data table */}
        <Card padding="none">
          <Table<ReportRow>
            columns={tableColumns}
            data={rows}
            loading={loading}
            emptyText="No data for this period"
          />
        </Card>

        {reportData?.truncated && (
          <p className="text-xs text-gray-400 text-center -mt-4">
            Showing a truncated set of rows. Export CSV for the full report.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
