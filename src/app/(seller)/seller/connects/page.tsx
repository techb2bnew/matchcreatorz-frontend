'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const plans = [
  { id: 1, name: 'Starter',  price: 9.99,  connects: 30,  discount: 0,  popular: false, description: 'Perfect for occasional bidding' },
  { id: 2, name: 'Pro',      price: 19.99, connects: 80,  discount: 15, popular: true,  description: 'Best value for active sellers' },
  { id: 3, name: 'Business', price: 39.99, connects: 200, discount: 20, popular: false, description: 'For high-volume bidding' },
];

const history = [
  { id: 1, description: 'Purchased Pro Plan',        type: 'Credit', connects: 80,  date: '2024-11-10' },
  { id: 2, description: 'Bid on React Developer job', type: 'Debit',  connects: 20,  date: '2024-11-09' },
  { id: 3, description: 'Bid on Logo Design job',     type: 'Debit',  connects: 20,  date: '2024-11-08' },
  { id: 4, description: 'Purchased Starter Plan',     type: 'Credit', connects: 30,  date: '2024-11-07' },
];

export default function ConnectsPage() {
  return (
    <DashboardLayout role="SELLER" title="Connects">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Available Connects" value="48"  icon="fa-link"   color="red"   change="Use to bid on jobs" />
        <StatCard title="Total Purchased"    value="110" icon="fa-credit-card" color="blue"  change="All time" />
        <StatCard title="Total Used"         value="62"  icon="fa-link"   color="green" change="All time bids" />
      </div>

      {/* Plans */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Buy Connects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-5 ${plan.popular ? 'border-[#e84545] shadow-lg' : 'border-[#e8e8e8] shadow-sm'}`}>
              {plan.popular && (
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
              <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
              <ul className="space-y-1.5 mb-5">
                <li className="flex items-center gap-2 text-xs text-gray-600"><i className="fa fa-check text-xs text-green-500" />Instant delivery</li>
                <li className="flex items-center gap-2 text-xs text-gray-600"><i className="fa fa-check text-xs text-green-500" />Never expire</li>
                <li className="flex items-center gap-2 text-xs text-gray-600"><i className="fa fa-check text-xs text-green-500" />Secure payment</li>
              </ul>
              <Button fullWidth variant={plan.popular ? 'primary' : 'outline'} leftIcon={<i className="fa fa-credit-card text-sm" />}>
                Buy Now
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <CardTitle>Connect History</CardTitle>
        </div>
        <div className="divide-y divide-gray-50">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`p-2.5 rounded-xl ${h.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                <i className={`fa fa-link text-sm ${h.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{h.description}</p>
                <p className="text-xs text-gray-400">{formatDate(h.date)}</p>
              </div>
              <p className={`font-bold ${h.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`}>
                {h.type === 'Credit' ? '+' : '-'}{h.connects} connects
              </p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
