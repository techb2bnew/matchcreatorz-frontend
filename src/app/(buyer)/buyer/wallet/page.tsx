'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

const transactions = [
  { id: 1, type: 'Credit', description: 'Wallet Top-up via Stripe',   amount: 1000, date: '2024-11-10', status: 'Paid' },
  { id: 2, type: 'Debit',  description: 'Booking #8 - Logo Design',   amount: 275,  date: '2024-11-08', status: 'Paid' },
  { id: 3, type: 'Debit',  description: 'Booking #7 - Web Dev',       amount: 1320, date: '2024-11-05', status: 'Paid' },
  { id: 4, type: 'Credit', description: 'Refund - Booking #6',        amount: 400,  date: '2024-11-02', status: 'Paid' },
  { id: 5, type: 'Credit', description: 'Wallet Top-up via Stripe',   amount: 2000, date: '2024-10-28', status: 'Paid' },
];

export default function BuyerWalletPage() {
  const [addModal, setAddModal] = useState(false);
  const [amount, setAmount] = useState('');

  const quickAmounts = [100, 250, 500, 1000];

  return (
    <DashboardLayout role="BUYER" title="My Wallet">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Wallet Balance"   value="$1,405"  icon="fa-dollar"    color="red"   change="Available for bookings" />
        <StatCard title="Total Spent"      value="$3,840"  icon="fa-arrow-up"  color="blue"  change="All time" />
        <StatCard title="Total Refunded"   value="$400"    icon="fa-arrow-down" color="green" change="All time" />
      </div>

      {/* Add money */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-semibold text-gray-900">Add Money to Wallet</h3>
            <p className="text-sm text-gray-400 mt-0.5">Funds added instantly via Stripe. Use for booking services.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#e84545]">$1,405</p>
            <p className="text-xs text-gray-400">Current balance</p>
          </div>
          <Button leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => setAddModal(true)}>Add Money</Button>
        </div>
      </Card>

      {/* Transactions */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <CardTitle>Transaction History</CardTitle>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`p-2.5 rounded-xl ${t.type === 'Credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                {t.type === 'Credit'
                  ? <i className="fa fa-arrow-down text-base text-green-600" />
                  : <i className="fa fa-arrow-up text-base text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
              </div>
              <p className={`font-bold text-base ${t.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'Credit' ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Money Modal */}
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
          <Input
            label="Custom amount"
            type="number"
            placeholder="Enter amount"
            leftIcon={<i className="fa fa-dollar text-sm" />}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
            <p>💳 You will be redirected to Stripe to complete the payment securely.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setAddModal(false)}>Cancel</Button>
            <Button fullWidth leftIcon={<i className="fa fa-credit-card text-sm" />} disabled={!amount}>
              Pay via Stripe
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
