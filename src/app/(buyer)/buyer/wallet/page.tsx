'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { walletApi } from '@/lib/adminApi';
import toast from 'react-hot-toast';

const TX_LABEL: Record<string, string> = {
  topup: 'Wallet top-up', booking_payment: 'Booking payment', booking_refund: 'Booking refund',
  earning: 'Earning', platform_fee: 'Platform fee', withdrawal: 'Withdrawal',
  withdrawal_reversal: 'Withdrawal reversed', adjustment: 'Adjustment',
  milestone_release: 'Milestone released to seller',
};

interface Summary { balance: number; total_in: number; total_out: number; currency: string; pending_payment?: number }
interface Txn { id: number; amount: string | number; type: string; note?: string; created_at?: string; createdAt?: string; balance_after: string | number }

function BuyerWalletInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const quickAmounts = [100, 250, 500, 1000];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([walletApi.summary(), walletApi.transactions({ limit: 50 })]);
      setSummary(s.data); setTxns(t.data || []);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Handle Stripe Checkout return
  useEffect(() => {
    const status = params.get('topup');
    const sessionId = params.get('session_id');
    if (status === 'success' && sessionId) {
      walletApi.confirmTopup(sessionId)
        .then(() => { toast.success('Wallet topped up!'); load(); })
        .catch(() => load())
        .finally(() => router.replace('/buyer/wallet'));
    } else if (status === 'cancel') {
      toast('Top-up cancelled'); router.replace('/buyer/wallet');
    }
  }, [params, router, load]);

  const startTopup = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setPaying(true);
    try {
      const res = await walletApi.topup(amt);
      window.location.href = res.data.url;   // redirect to Stripe Checkout
    } catch (e) { toast.error((e as Error).message); setPaying(false); }
  };

  return (
    <DashboardLayout role="BUYER" title="My Wallet">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Wallet Balance" value={loading ? '…' : formatCurrency(summary?.balance || 0)} icon="fa-dollar"    color="red"   change="Available for bookings" />
        <StatCard title="Pending Payment" value={loading ? '…' : formatCurrency(summary?.pending_payment || 0)} icon="fa-clock-o" color="purple" change="Charged when you accept" />
        <StatCard title="Total Spent"    value={loading ? '…' : formatCurrency(summary?.total_out || 0)} icon="fa-arrow-up"  color="blue"  change="All time" />
        <StatCard title="Total Added"    value={loading ? '…' : formatCurrency(summary?.total_in || 0)} icon="fa-arrow-down" color="green" change="All time" />
      </div>

      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-semibold text-gray-900">Add Money to Wallet</h3>
            <p className="text-sm text-gray-400 mt-0.5">Funds added via Stripe. Charged from your balance the moment you accept a delivered booking or milestone.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#e84545]">{formatCurrency(summary?.balance || 0)}</p>
            <p className="text-xs text-gray-400">Current balance</p>
          </div>
          <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => setAddModal(true)}>Add Money</Button>
        </div>
      </Card>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100"><CardTitle>Transaction History</CardTitle></div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : txns.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {txns.map((t) => {
              const amt = Number(t.amount);
              const isInfo = amt === 0;
              const credit = amt > 0;
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`p-2.5 rounded-xl ${isInfo ? 'bg-blue-50' : credit ? 'bg-green-50' : 'bg-red-50'}`}>
                    <i className={`fa ${isInfo ? 'fa-info-circle text-blue-500' : credit ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-500'} text-base`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.note || TX_LABEL[t.type] || t.type}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.created_at || t.createdAt || '')}</p>
                  </div>
                  {!isInfo && (
                    <p className={`font-bold text-base ${credit ? 'text-green-600' : 'text-red-500'}`}>
                      {credit ? '+' : '-'}{formatCurrency(Math.abs(amt))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Money to Wallet">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick amounts</p>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((a) => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${amount === String(a) ? 'border-[#e84545] bg-[#fff0f0] text-[#e84545]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  ${a}
                </button>
              ))}
            </div>
          </div>
          <Input label="Custom amount" type="number" placeholder="Enter amount" leftIcon={<i className="fa fa-dollar text-sm" />} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">💳 You'll be redirected to Stripe to pay securely, then back here.</div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setAddModal(false)}>Cancel</Button>
            <Button fullWidth leftIcon={<i className="fa fa-credit-card text-sm" />} disabled={!amount || paying} onClick={startTopup}>
              {paying ? 'Redirecting…' : 'Pay via Stripe'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default function BuyerWalletPage() {
  return <Suspense fallback={null}><BuyerWalletInner /></Suspense>;
}
