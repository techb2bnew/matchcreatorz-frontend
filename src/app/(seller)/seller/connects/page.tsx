'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sellerConnectApi } from '@/lib/adminApi';
import { Spinner } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  connects: number;
  discount: number;
}

// Fallback shown while the real plan list loads from the backend (avoids a blank flash).
const FALLBACK_PLANS: Plan[] = [
  { id: 'starter',  name: 'Starter',  price: 9.99,  connects: 30,  discount: 0  },
  { id: 'pro',      name: 'Pro',      price: 19.99, connects: 80,  discount: 15 },
  { id: 'business', name: 'Business', price: 39.99, connects: 200, discount: 20 },
];

const PLAN_DESCRIPTIONS: Record<string, string> = {
  starter:  'Perfect for occasional bidding',
  pro:      'Best value for active sellers',
  business: 'For high-volume bidding',
};

interface Ledger {
  id: number;
  amount: number;
  type: string;
  note: string | null;
  balance_after: number | null;
  created_at: string;
}

function ConnectsPageInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [balance, setBalance]   = useState<number>(0);
  const [history, setHistory]   = useState<Ledger[]>([]);
  const [plans, setPlans]       = useState<Plan[]>(FALLBACK_PLANS);
  const [loading, setLoading]   = useState(true);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        sellerConnectApi.balance(),
        sellerConnectApi.history({ limit: 50 }),
      ]);
      const b = bal?.data?.balance ?? bal?.data ?? 0;
      setBalance(typeof b === 'number' ? b : Number(b) || 0);
      setHistory(hist.data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load connects');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Plans are server-defined (price/connects are never trusted from the client)
  useEffect(() => {
    sellerConnectApi.plans()
      .then((res) => { if (Array.isArray(res?.data) && res.data.length) setPlans(res.data); })
      .catch(() => { /* keep fallback plans */ });
  }, []);

  // Handle Stripe Checkout return
  useEffect(() => {
    const status    = params.get('purchase');
    const sessionId = params.get('session_id');
    if (status === 'success' && sessionId) {
      sellerConnectApi.confirmPurchase(sessionId)
        .then(() => { toast.success('Connects added to your balance!'); load(); })
        .catch(() => load())
        .finally(() => router.replace('/seller/connects'));
    } else if (status === 'cancel') {
      toast('Purchase cancelled');
      router.replace('/seller/connects');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, router]);

  const buyPlan = async (planId: string) => {
    setBuyingPlan(planId);
    try {
      const res = await sellerConnectApi.purchase(planId);
      window.location.href = res.data.url; // redirect to Stripe Checkout
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start purchase');
      setBuyingPlan(null);
    }
  };

  const isCredit = (l: Ledger) => Number(l.amount) >= 0 && !/debit|spend|use|bid/i.test(l.type || '');
  const totalCredited = history.filter(isCredit).reduce((s, h) => s + Math.abs(Number(h.amount)), 0);
  const totalUsed     = history.filter((h) => !isCredit(h)).reduce((s, h) => s + Math.abs(Number(h.amount)), 0);

  return (
    <DashboardLayout role="SELLER" title="Connects">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Available Connects" value={loading ? '--' : String(balance)} icon="fa-link"        color="red"   change="Use to bid on jobs" />
        <StatCard title="Total Received"     value={loading ? '--' : String(totalCredited)} icon="fa-credit-card" color="blue"  change="All time" />
        <StatCard title="Total Used"         value={loading ? '--' : String(totalUsed)} icon="fa-link"        color="green" change="All time bids" />
      </div>

      {/* Plans */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Buy Connects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const popular = plan.id === 'pro' || (plans.length > 1 && i === 1);
            return (
              <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-5 ${popular ? 'border-[#e84545] shadow-lg' : 'border-[#e8e8e8] shadow-sm'}`}>
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e84545] text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">{plan.name}</h4>
                  {plan.discount > 0 && <Badge variant="success">{plan.discount}% off</Badge>}
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-black text-gray-900">{formatCurrency(plan.price)}</span>
                </div>
                <p className="text-2xl font-bold text-[#e84545] mb-1">{plan.connects} Connects</p>
                <p className="text-sm text-gray-400 mb-4">{PLAN_DESCRIPTIONS[plan.id] || 'Grow your bidding power'}</p>
                <ul className="space-y-1.5 mb-5">
                  <li className="flex items-center gap-2 text-xs text-gray-600"><i className="fa fa-check text-xs text-green-500" />Instant delivery</li>
                  <li className="flex items-center gap-2 text-xs text-gray-600"><i className="fa fa-check text-xs text-green-500" />Never expire</li>
                  <li className="flex items-center gap-2 text-xs text-gray-600"><i className="fa fa-check text-xs text-green-500" />Secure payment</li>
                </ul>
                <Button
                  fullWidth
                  variant={popular ? 'primary' : 'outline'}
                  loading={buyingPlan === plan.id}
                  disabled={buyingPlan !== null && buyingPlan !== plan.id}
                  leftIcon={<i className="fa fa-credit-card text-sm" />}
                  onClick={() => buyPlan(plan.id)}
                >
                  Buy Now
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <CardTitle>Connect History</CardTitle>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-14"><Spinner size="lg" /></div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <i className="fa fa-link text-2xl mb-2" />
            <p className="text-sm">No connect activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((h) => {
              const credit = isCredit(h);
              return (
                <div key={h.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`p-2.5 rounded-xl ${credit ? 'bg-green-50' : 'bg-red-50'}`}>
                    <i className={`fa fa-link text-sm ${credit ? 'text-green-600' : 'text-red-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{h.note || h.type || 'Connect adjustment'}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(h.created_at)}
                      {h.balance_after != null && <span className="ml-2">· Balance: {h.balance_after}</span>}
                    </p>
                  </div>
                  <p className={`font-bold ${credit ? 'text-green-600' : 'text-red-500'}`}>
                    {credit ? '+' : '-'}{Math.abs(Number(h.amount))} connects
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

export default function ConnectsPage() {
  return <Suspense fallback={null}><ConnectsPageInner /></Suspense>;
}
