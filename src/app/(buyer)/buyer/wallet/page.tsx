'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import TransactionRow, { type Txn } from '@/components/wallet/TransactionRow';
import { formatCurrency } from '@/lib/utils';
import { walletApi, buyerBookingApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

const TX_LABEL: Record<string, string> = {
  topup: 'Wallet top-up', booking_payment: 'Booking payment', booking_refund: 'Booking refund',
  earning: 'Earning', platform_fee: 'Platform fee', withdrawal: 'Withdrawal',
  withdrawal_reversal: 'Withdrawal reversed', adjustment: 'Adjustment',
  milestone_release: 'Milestone released to seller',
  escrow_hold: 'Hold Payment',
  escrow_payment: 'Paid via Stripe',
};

interface Summary {
  balance: number; total_in: number; total_out: number; currency: string;
  pending_payment?: number; total_spent?: number; card_spent?: number; payments_count?: number;
}

function BuyerWalletInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // 'hold' filters to escrow_hold entries — every Pay & Hold placed, whether
  // still pending release or already resolved (released/cancelled).
  const [txTab, setTxTab] = useState<'all' | 'hold'>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [s, t] = await Promise.all([
        walletApi.summary(),
        walletApi.transactions({ limit: 50, search: search || undefined, type: txTab === 'hold' ? 'escrow_hold' : undefined }),
      ]);
      setSummary(s.data); setTxns(t.data || []);
    } catch (e) {
      if (!silent) toast.error((e as Error).message);
      else console.error('Silent wallet refresh failed', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, txTab]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [load]);

  // Kept so a top-up started before Add Money was disabled still confirms if
  // the buyer lands back here with the Stripe return params.
  useEffect(() => {
    const status = params.get('topup');
    const sessionId = params.get('session_id');
    if (status === 'success' && sessionId) {
      walletApi.confirmTopup(sessionId)
        .then(() => { toast.success('Payment confirmed'); load(); })
        .catch(() => load())
        .finally(() => router.replace('/buyer/wallet'));
    }
  }, [params, router, load]);

  useAutoRefresh(() => load(true), 20000);

  const cancelHold = async (t: Txn) => {
    setCancellingId(t.id);
    try {
      if (t.milestone_id) await buyerBookingApi.cancelMilestoneHold(t.booking_id!, t.milestone_id);
      else if (t.work_entry_id) await buyerBookingApi.cancelWorkEntryHold(t.booking_id!, t.work_entry_id);
      else if (t.booking_id) await buyerBookingApi.cancelHold(t.booking_id);
      else throw new Error('Unable to determine what this hold belongs to');
      toast.success('Hold cancelled — no charge was made');
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setCancellingId(null); }
  };

  return (
    <DashboardLayout role="BUYER" title="My Payments">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Spent"     value={loading ? '…' : formatCurrency(summary?.total_spent || 0)} icon="fa-arrow-up"  color="red"    change="All time" />
        <StatCard title="Payments"        value={loading ? '…' : String(summary?.payments_count ?? 0)}      icon="fa-credit-card" color="blue"  change="Bookings paid" />
        <StatCard title="Pending Payment" value={loading ? '…' : formatCurrency(summary?.pending_payment || 0)} icon="fa-clock-o" color="purple" change="Charged when you accept" />
      </div>

      {/*
        "Add Money to Wallet" is intentionally disabled — buyers now pay each
        booking directly by card through Stripe, so there is no wallet balance
        to top up. To bring it back, restore the Add Money card, the top-up
        modal and <EmbeddedCheckoutModal>, along with the addModal / amount /
        paying / checkoutClientSecret state and the startTopup handler.
      */}

      <Card padding="none">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 flex-wrap">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-9 w-full sm:w-64">
            <i className="fa fa-search text-xs text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 pt-3">
          {(['all', 'hold'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTxTab(tabKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${txTab === tabKey ? 'bg-[#e84545] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {tabKey === 'all' ? 'All Transactions' : 'Hold Payments'}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : txns.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {search.trim() ? 'No transactions match your search.' : txTab === 'hold' ? 'No hold payments yet.' : 'No transactions yet.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {txns.map((t) => (
              <TransactionRow
                key={t.id} t={t} label={TX_LABEL[t.type] || t.type}
                onCancelHold={() => cancelHold(t)}
                cancelling={cancellingId === t.id}
              />
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

export default function BuyerWalletPage() {
  return <Suspense fallback={null}><BuyerWalletInner /></Suspense>;
}
