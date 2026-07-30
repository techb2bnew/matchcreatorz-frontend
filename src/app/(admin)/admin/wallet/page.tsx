'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { walletApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

interface Overview {
  platform_revenue: number; total_topups: number;
  total_earnings_paid: number; pending_withdrawals: number; paid_withdrawals: number;
  admin_wallet: { balance: number };
}
interface Wd { id: number; amount: string | number; status: string; created_at?: string; createdAt?: string; seller?: { name: string; email: string } }

const BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', rejected: 'bg-gray-200 text-gray-600', failed: 'bg-red-100 text-red-700',
};

export default function AdminWalletPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [wds, setWds] = useState<Wd[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, w] = await Promise.all([walletApi.adminOverview(), walletApi.adminWithdrawals({ status: filter, limit: 50 })]);
      setOv(o.data); setWds(w.data || []);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: number) => {
    setBusyId(id);
    try { await walletApi.approveWithdrawal(id); toast.success('Approved & paid out'); load(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusyId(null); }
  };
  const reject = async (id: number) => {
    const note = window.prompt('Reason for rejection (optional):') || undefined;
    setBusyId(id);
    try { await walletApi.rejectWithdrawal(id, note); toast.success('Rejected & refunded'); load(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusyId(null); }
  };

  const v = (n?: number) => (loading ? '…' : formatCurrency(n || 0));

  return (
    <DashboardLayout role="ADMIN" title="Wallet & Payments">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Platform Revenue"   value={v(ov?.platform_revenue)}    icon="fa-line-chart" color="green" change="Fees earned" />
        <StatCard title="Pending Withdrawals" value={v(ov?.pending_withdrawals)} icon="fa-clock-o"   color="red"   change="Awaiting approval" />
        <StatCard title="Paid Out"           value={v(ov?.paid_withdrawals)}    icon="fa-check"      color="blue"  change="All time" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Top-ups"      value={v(ov?.total_topups)}        icon="fa-arrow-down" color="green" change="Buyer deposits" />
        <StatCard title="Earnings Paid to Sellers" value={v(ov?.total_earnings_paid)} icon="fa-users" color="blue" change="All time" />
        <StatCard title="Platform Wallet"    value={v(ov?.admin_wallet?.balance)} icon="fa-dollar"   color="purple" change="Current balance" />
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Withdrawal Requests</CardTitle>
          <div className="flex gap-1 text-xs">
            {['pending', 'approved', 'paid', 'rejected', ''].map((s) => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-full capitalize ${filter === s ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s || 'all'}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : wds.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No withdrawal requests.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {wds.map((w) => (
              <div key={w.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{w.seller?.name || 'Seller'}</p>
                  <p className="text-xs text-gray-400 truncate">{w.seller?.email} · {formatDate(w.created_at || w.createdAt || '')}</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(Number(w.amount))}</p>
                <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${BADGE[w.status] || 'bg-gray-100 text-gray-600'}`}>{w.status}</span>
                {w.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busyId === w.id} onClick={() => approve(w.id)}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={busyId === w.id} onClick={() => reject(w.id)}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
