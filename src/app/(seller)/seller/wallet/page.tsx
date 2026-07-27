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
  topup: 'Top-up', booking_payment: 'Booking payment', booking_refund: 'Refund',
  earning: 'Booking earning', platform_fee: 'Platform fee', withdrawal: 'Withdrawal',
  withdrawal_reversal: 'Withdrawal returned', adjustment: 'Adjustment',
};
const WD_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', rejected: 'bg-gray-200 text-gray-600', failed: 'bg-red-100 text-red-700',
};

interface Summary { balance: number; pending_withdraw: number; total_in: number; total_out: number; connected: boolean; stripe_account_status: string }
interface Txn { id: number; amount: string | number; type: string; note?: string; created_at?: string; createdAt?: string }
interface Wd { id: number; amount: string | number; status: string; created_at?: string; createdAt?: string }

function SellerWalletInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [loading, setLoading] = useState(true);
  const [wModal, setWModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState<{ min_withdraw: number }>({ min_withdraw: 50 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, w, c] = await Promise.all([
        walletApi.connectStatus(), walletApi.transactions({ limit: 50 }), walletApi.myWithdrawals({ limit: 20 }), walletApi.config(),
      ]);
      setSummary(s.data); setTxns(t.data || []); setWds(w.data || []); setCfg(c.data);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.get('connect')) { toast.success('Payout account updated'); load(); router.replace('/seller/wallet'); }
  }, [params, router, load]);

  const connect = async () => {
    setBusy(true);
    try { const res = await walletApi.connectOnboard(); window.location.href = res.data.url; }
    catch (e) { toast.error((e as Error).message); setBusy(false); }
  };

  const submitWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setBusy(true);
    try {
      await walletApi.withdraw(amt);
      toast.success('Withdrawal requested');
      setWModal(false); setAmount(''); load();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const connected = summary?.connected;

  return (
    <DashboardLayout role="SELLER" title="Wallet">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Available Balance" value={loading ? '…' : formatCurrency(summary?.balance || 0)} icon="fa-dollar"    color="red"   change="Ready to withdraw" />
        <StatCard title="Total Earnings"    value={loading ? '…' : formatCurrency(summary?.total_in || 0)} icon="fa-arrow-down" color="green" change="All time" />
        <StatCard title="Total Withdrawn"   value={loading ? '…' : formatCurrency(summary?.total_out || 0)} icon="fa-arrow-up"  color="blue"  change="All time" />
        <StatCard title="Pending Payout"    value={loading ? '…' : formatCurrency(summary?.pending_withdraw || 0)} icon="fa-clock-o" color="purple" change="Awaiting approval" />
      </div>

      {/* Connect / Withdraw */}
      <Card padding="md" className="mb-6">
        {!connected ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <h3 className="font-semibold text-gray-900">Set up payouts</h3>
              <p className="text-sm text-gray-400 mt-0.5">Connect your Stripe account to receive withdrawals to your bank.</p>
            </div>
            <Button leftIcon={<i className="fa fa-link text-sm" />} disabled={busy} onClick={connect}>
              {busy ? 'Redirecting…' : 'Connect Payout Account'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-semibold text-gray-900">Request Withdrawal <span className="text-green-600 text-xs ml-1"><i className="fa fa-check-circle" /> Connected</span></h3>
              <p className="text-sm text-gray-400 mt-0.5">Minimum {formatCurrency(cfg.min_withdraw)}. Paid out after admin approval.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#e84545]">{formatCurrency(summary?.balance || 0)}</p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
            <Button leftIcon={<i className="fa fa-credit-card text-sm" />} onClick={() => setWModal(true)} disabled={(summary?.balance || 0) < cfg.min_withdraw}>
              Withdraw
            </Button>
          </div>
        )}
      </Card>

      {/* Withdrawals */}
      {wds.length > 0 && (
        <Card padding="none" className="mb-6">
          <div className="p-4 border-b border-gray-100"><CardTitle>Withdrawal Requests</CardTitle></div>
          <div className="divide-y divide-gray-50">
            {wds.map((w) => (
              <div key={w.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(w.amount))}</p>
                  <p className="text-xs text-gray-400">{formatDate(w.created_at || w.createdAt || '')}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${WD_BADGE[w.status] || 'bg-gray-100 text-gray-600'}`}>{w.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transactions */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100"><CardTitle>Transaction History</CardTitle></div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : txns.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {txns.map((t) => {
              const amt = Number(t.amount); const credit = amt >= 0;
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`p-2.5 rounded-xl ${credit ? 'bg-green-50' : 'bg-red-50'}`}>
                    <i className={`fa ${credit ? 'fa-arrow-down text-green-600' : 'fa-arrow-up text-red-500'} text-base`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.note || TX_LABEL[t.type] || t.type}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.created_at || t.createdAt || '')}</p>
                  </div>
                  <p className={`font-bold text-base ${credit ? 'text-green-600' : 'text-red-500'}`}>
                    {credit ? '+' : '-'}{formatCurrency(Math.abs(amt))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={wModal} onClose={() => setWModal(false)} title="Request Withdrawal">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
            Available: <b className="text-[#e84545]">{formatCurrency(summary?.balance || 0)}</b> · Min: {formatCurrency(cfg.min_withdraw)}
          </div>
          <Input label="Amount" type="number" placeholder="Enter amount" leftIcon={<i className="fa fa-dollar text-sm" />} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setWModal(false)}>Cancel</Button>
            <Button fullWidth disabled={!amount || busy} onClick={submitWithdraw}>{busy ? 'Requesting…' : 'Request Withdrawal'}</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default function SellerWalletPage() {
  return <Suspense fallback={null}><SellerWalletInner /></Suspense>;
}
